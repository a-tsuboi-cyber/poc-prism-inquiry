const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const documentService = require('./documentService');

// Multer 一時アップロードディレクトリ
const upload = multer({ dest: path.join(__dirname, '../../../uploads/temp') });

// ドキュメント一覧取得
router.get('/', (req, res) => {
  const { type, sortKey, sortOrder } = req.query;
  const docs = documentService.getAll({ type, sortKey, sortOrder });
  res.json(docs);
});

// ドキュメント新規アップロード登録
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }
    let user = null;
    if (req.body.user) {
      try { user = JSON.parse(req.body.user); } catch (e) {}
    }
    const doc = documentService.create({
      file: req.file,
      title: req.body.title,
      type: req.body.type,
      user
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('[DocumentRoutes] Upload error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// ドキュメント削除
router.delete('/:id', (req, res) => {
  const success = documentService.delete(req.params.id);
  if (!success) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true, message: 'Document deleted' });
});

// ドキュメントダウンロード
router.get('/:id/download', (req, res) => {
  const fileInfo = documentService.getFilePath(req.params.id);
  if (!fileInfo) return res.status(404).json({ error: 'File not found' });
  res.download(fileInfo.path, fileInfo.originalName);
});

module.exports = router;
