const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DOCUMENTS_FILE = path.join(__dirname, '../../../data/documents.json');
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/documents');

// メモリ内テキストキャッシュ（パースの高速化）
const textCache = new Map();

// アップロード先ディレクトリの自動作成
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDocuments() {
  if (!fs.existsSync(DOCUMENTS_FILE)) return [];
  const raw = fs.readFileSync(DOCUMENTS_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeDocuments(data) {
  fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const documentService = {
  /**
   * ドキュメント一覧取得（種別絞り込み・ソート対応）
   */
  getAll({ type, sortKey = 'createdAt', sortOrder = 'desc' } = {}) {
    let list = readDocuments();

    if (type) {
      list = list.filter(d => d.type === type);
    }

    list.sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';
      
      // 文字列比較
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB, 'ja');
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return list;
  },

  getById(id) {
    const list = readDocuments();
    return list.find(d => d.id === id) || null;
  },

  /**
   * ドキュメント新規登録
   */
  create({ title, type, user, file }) {
    if (!file) throw new Error('File is required');
    const list = readDocuments();

    const timestamp = Date.now();
    const newId = `DOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(list.length + 1).padStart(3, '0')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const storedFileName = `${newId}_${file.originalname}`;
    const targetPath = path.join(UPLOADS_DIR, storedFileName);

    // 一時ファイルまたはバッファから目的パスへ保存
    if (file.path) {
      fs.renameSync(file.path, targetPath);
    } else if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    }

    const doc = {
      id: newId,
      title: title || file.originalname,
      type: type || 'knowledge',
      originalFileName: file.originalname,
      fileExtension: ext,
      fileSize: file.size,
      storedFileName: storedFileName,
      uploadedBy: user?.name ? `${user.name} (${user.email || ''})` : '坪井 (a-tsuboi@ntv.co.jp)',
      createdAt: new Date().toISOString()
    };

    list.unshift(doc);
    writeDocuments(list);
    return doc;
  },

  /**
   * ドキュメント削除（実ファイルとメタデータ削除）
   */
  delete(id) {
    const list = readDocuments();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const doc = list[idx];
    const targetPath = path.join(UPLOADS_DIR, doc.storedFileName);
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch (err) {
        console.warn(`[DocumentService] Failed to unlink file: ${targetPath}`, err.message);
      }
    }

    textCache.delete(doc.storedFileName);
    list.splice(idx, 1);
    writeDocuments(list);
    return true;
  },

  /**
   * 実ファイルパスの取得（ダウンロード用）
   */
  getFilePath(id) {
    const doc = this.getById(id);
    if (!doc) return null;
    const targetPath = path.join(UPLOADS_DIR, doc.storedFileName);
    return fs.existsSync(targetPath) ? { path: targetPath, originalName: doc.originalFileName } : null;
  },

  /**
   * ファイルからテキストを抽出（プレーンテキストおよびPDFに対応）
   */
  async extractText(filePath, fileExtension) {
    if (!fs.existsSync(filePath)) return '';
    const ext = (fileExtension || '').toLowerCase();

    // プレーンテキスト形式
    if (['.txt', '.md', '.csv', '.json'].includes(ext)) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    // PDF形式
    if (ext === '.pdf') {
      try {
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: buffer });
        await parser.load();
        const res = await parser.getText();
        return res?.text || '';
      } catch (err) {
        console.warn(`[DocumentService] Failed to parse PDF: ${filePath}`, err.message);
        return '';
      }
    }

    return '';
  },

  /**
   * 登録ドキュメント（ナレッジ・マニュアル）のテキスト内容を抽出・集約（AI回答用コンテキスト）
   */
  async getKnowledgeDocumentsContent() {
    const list = this.getAll();
    const supportedExtensions = ['.txt', '.md', '.csv', '.json', '.pdf'];
    let combined = '';

    for (const doc of list) {
      if (supportedExtensions.includes(doc.fileExtension)) {
        const filePath = path.join(UPLOADS_DIR, doc.storedFileName);
        if (fs.existsSync(filePath)) {
          let content = textCache.get(doc.storedFileName);
          if (content === undefined) {
            content = await this.extractText(filePath, doc.fileExtension);
            textCache.set(doc.storedFileName, content);
          }

          if (content && content.trim().length > 0) {
            const typeLabel = doc.type === 'manual' ? 'マニュアル' : 'ナレッジ';
            // 各ドキュメント最大20,000文字まで含める（Gemini 3.8 Flashのコンテキスト長に適合）
            combined += `\n\n【登録ドキュメント: ${doc.title} [種別: ${typeLabel}] (${doc.originalFileName})】\n${content.slice(0, 20000)}`;
          }
        }
      }
    }

    return combined.trim();
  }
};

module.exports = documentService;
