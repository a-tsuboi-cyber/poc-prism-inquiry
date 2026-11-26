import React, { useState, useEffect } from 'react';
import { DocumentItem } from '@/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Upload, FileText, Download, Trash2, RefreshCw, FileCheck, Pencil } from 'lucide-react';

export const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 編集モーダル状態
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'knowledge' | 'manual'>('knowledge');
  const [isUpdating, setIsUpdating] = useState(false);

  // アップロードフォーム状態
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<'knowledge' | 'manual'>('knowledge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDocuments({
        type: filterType !== 'all' ? filterType : undefined,
      });
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle || selectedFile.name);
      formData.append('type', uploadType);

      await api.uploadDocument(formData);
      setShowUploadModal(false);
      setUploadTitle('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return;
    try {
      await api.deleteDocument(id);
      fetchDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const openEditModal = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditType(doc.type);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      alert('ドキュメント名を入力してください。');
      return;
    }

    setIsUpdating(true);
    try {
      await api.updateDocument(editingDoc.id, {
        title: trimmedTitle,
        type: editType,
      });
      setEditingDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error('Update failed:', err);
      alert('ドキュメントの更新に失敗しました。');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Upload Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">種別: すべて</option>
            <option value="knowledge">ナレッジ・手順書</option>
            <option value="manual">利用者マニュアル</option>
          </select>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            ※ PDF・テキスト登録内容は自動解析され、AI一次受け回答時に参照されます
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            再読み込み
          </Button>
          <Button
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            ファイル追加
          </Button>
        </div>
      </div>

      {/* Document List Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">登録ドキュメント ({documents.length}件)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">種別</th>
                  <th className="py-3 px-4">ドキュメント名</th>
                  <th className="py-3 px-4">ファイル名</th>
                  <th className="py-3 px-4">サイズ</th>
                  <th className="py-3 px-4">登録者</th>
                  <th className="py-3 px-4">登録日時</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      登録されているドキュメントはありません
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <Badge variant={doc.type === 'manual' ? 'default' : 'secondary'}>
                          {doc.type === 'manual' ? 'マニュアル' : 'ナレッジ'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                        {doc.title}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        {doc.originalFileName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {doc.uploadedBy}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(doc)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="編集"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={api.getDocumentDownloadUrl(doc.id)}
                            download
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="ダウンロード"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="削除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <Dialog
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="ドキュメントアップロード"
          description="PDF、テキスト、Markdownファイルをアップロードして、AIの回答根拠として学習・参照させます。"
        >
          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                ドキュメント表示名 (任意)
              </label>
              <Input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="例: PRISM システム障害対応マニュアル 2026年版"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">ドキュメント種別</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="knowledge">ナレッジ・手順書 (AI参照用)</option>
                <option value="manual">利用者マニュアル (ユーザー閲覧・ダウンロード用)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                ファイル選択 <span className="text-red-500">*</span>
              </label>
              <Input
                type="file"
                accept=".pdf,.txt,.md,.json,.csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                対応形式: PDF, TXT, Markdown, CSV, JSON
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'アップロード中...' : 'アップロード'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Edit Modal */}
      {editingDoc && (
        <Dialog
          open={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          title={`ドキュメント編集: ${editingDoc.id}`}
          description="ドキュメントの表示名および種別（ナレッジ/マニュアル）を変更します。"
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                ドキュメント表示名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="ドキュメント名を入力"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">ドキュメント種別</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="knowledge">ナレッジ・手順書 (AI参照用)</option>
                <option value="manual">利用者マニュアル (ユーザー閲覧・ダウンロード用)</option>
              </select>
            </div>

            <div className="rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1">
              <p>元ファイル名: <span className="font-mono">{editingDoc.originalFileName}</span></p>
              <p>登録者: {editingDoc.uploadedBy}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDoc(null)}
                disabled={isUpdating}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                {isUpdating ? '更新中...' : '更新保存'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
