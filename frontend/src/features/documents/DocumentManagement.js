import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Upload, FileText, Download, Trash2, RefreshCw, Pencil } from 'lucide-react';
export const DocumentManagement = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    // 編集モーダル状態
    const [editingDoc, setEditingDoc] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editType, setEditType] = useState('knowledge');
    const [isUpdating, setIsUpdating] = useState(false);
    // アップロードフォーム状態
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadType, setUploadType] = useState('knowledge');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const data = await api.getDocuments({
                type: filterType !== 'all' ? filterType : undefined,
            });
            setDocuments(data);
        }
        catch (err) {
            console.error('Failed to fetch documents:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchDocuments();
    }, [filterType]);
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile)
            return;
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
        }
        catch (err) {
            console.error('Upload failed:', err);
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('このドキュメントを削除しますか？'))
            return;
        try {
            await api.deleteDocument(id);
            fetchDocuments();
        }
        catch (err) {
            console.error('Delete failed:', err);
        }
    };
    const openEditModal = (doc) => {
        setEditingDoc(doc);
        setEditTitle(doc.title);
        setEditType(doc.type);
    };
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingDoc)
            return;
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
        }
        catch (err) {
            console.error('Update failed:', err);
            alert('ドキュメントの更新に失敗しました。');
        }
        finally {
            setIsUpdating(false);
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring", children: [_jsx("option", { value: "all", children: "\u7A2E\u5225: \u3059\u3079\u3066" }), _jsx("option", { value: "knowledge", children: "\u30CA\u30EC\u30C3\u30B8\u30FB\u624B\u9806\u66F8" }), _jsx("option", { value: "manual", children: "\u5229\u7528\u8005\u30DE\u30CB\u30E5\u30A2\u30EB" })] }), _jsx("span", { className: "text-xs text-muted-foreground hidden sm:inline", children: "\u203B PDF\u30FB\u30C6\u30AD\u30B9\u30C8\u767B\u9332\u5185\u5BB9\u306F\u81EA\u52D5\u89E3\u6790\u3055\u308C\u3001AI\u4E00\u6B21\u53D7\u3051\u56DE\u7B54\u6642\u306B\u53C2\u7167\u3055\u308C\u307E\u3059" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: fetchDocuments, className: "text-xs h-8 flex items-center gap-1.5", children: [_jsx(RefreshCw, { className: `h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}` }), "\u518D\u8AAD\u307F\u8FBC\u307F"] }), _jsxs(Button, { size: "sm", onClick: () => setShowUploadModal(true), className: "text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5", children: [_jsx(Upload, { className: "h-4 w-4" }), "\u30D5\u30A1\u30A4\u30EB\u8FFD\u52A0"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-base", children: ["\u767B\u9332\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8 (", documents.length, "\u4EF6)"] }) }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "border-y bg-muted/40 font-medium text-muted-foreground", children: _jsxs("tr", { children: [_jsx("th", { className: "py-3 px-4", children: "\u7A2E\u5225" }), _jsx("th", { className: "py-3 px-4", children: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u540D" }), _jsx("th", { className: "py-3 px-4", children: "\u30D5\u30A1\u30A4\u30EB\u540D" }), _jsx("th", { className: "py-3 px-4", children: "\u30B5\u30A4\u30BA" }), _jsx("th", { className: "py-3 px-4", children: "\u767B\u9332\u8005" }), _jsx("th", { className: "py-3 px-4", children: "\u767B\u9332\u65E5\u6642" }), _jsx("th", { className: "py-3 px-4 text-right", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { className: "divide-y divide-border", children: documents.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "py-8 text-center text-muted-foreground", children: "\u767B\u9332\u3055\u308C\u3066\u3044\u308B\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u306F\u3042\u308A\u307E\u305B\u3093" }) })) : (documents.map((doc) => (_jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [_jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: doc.type === 'manual' ? 'default' : 'secondary', children: doc.type === 'manual' ? 'マニュアル' : 'ナレッジ' }) }), _jsx("td", { className: "py-3 px-4 font-medium text-foreground max-w-xs truncate", children: doc.title }), _jsxs("td", { className: "py-3 px-4 font-mono text-muted-foreground flex items-center gap-1.5", children: [_jsx(FileText, { className: "h-3.5 w-3.5 text-blue-600" }), doc.originalFileName] }), _jsx("td", { className: "py-3 px-4 text-muted-foreground", children: formatFileSize(doc.fileSize) }), _jsx("td", { className: "py-3 px-4 text-muted-foreground", children: doc.uploadedBy }), _jsx("td", { className: "py-3 px-4 text-muted-foreground", children: new Date(doc.createdAt).toLocaleDateString('ja-JP') }), _jsx("td", { className: "py-3 px-4 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [_jsx("button", { onClick: () => openEditModal(doc), className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", title: "\u7DE8\u96C6", children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) }), _jsx("a", { href: api.getDocumentDownloadUrl(doc.id), download: true, className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", title: "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9", children: _jsx(Download, { className: "h-3.5 w-3.5" }) }), _jsx("button", { onClick: () => handleDelete(doc.id), className: "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive", title: "\u524A\u9664", children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] }) })] }, doc.id)))) })] }) }) })] }), showUploadModal && (_jsx(Dialog, { open: showUploadModal, onClose: () => setShowUploadModal(false), title: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9", description: "PDF\u3001\u30C6\u30AD\u30B9\u30C8\u3001Markdown\u30D5\u30A1\u30A4\u30EB\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u3066\u3001AI\u306E\u56DE\u7B54\u6839\u62E0\u3068\u3057\u3066\u5B66\u7FD2\u30FB\u53C2\u7167\u3055\u305B\u307E\u3059\u3002", children: _jsxs("form", { onSubmit: handleUpload, className: "space-y-4 text-xs", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "font-semibold text-foreground", children: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u8868\u793A\u540D (\u4EFB\u610F)" }), _jsx(Input, { value: uploadTitle, onChange: (e) => setUploadTitle(e.target.value), placeholder: "\u4F8B: PRISM \u30B7\u30B9\u30C6\u30E0\u969C\u5BB3\u5BFE\u5FDC\u30DE\u30CB\u30E5\u30A2\u30EB 2026\u5E74\u7248" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "font-semibold text-foreground", children: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u7A2E\u5225" }), _jsxs("select", { value: uploadType, onChange: (e) => setUploadType(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "knowledge", children: "\u30CA\u30EC\u30C3\u30B8\u30FB\u624B\u9806\u66F8 (AI\u53C2\u7167\u7528)" }), _jsx("option", { value: "manual", children: "\u5229\u7528\u8005\u30DE\u30CB\u30E5\u30A2\u30EB (\u30E6\u30FC\u30B6\u30FC\u95B2\u89A7\u30FB\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u7528)" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "font-semibold text-foreground", children: ["\u30D5\u30A1\u30A4\u30EB\u9078\u629E ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { type: "file", accept: ".pdf,.txt,.md,.json,.csv", onChange: (e) => setSelectedFile(e.target.files?.[0] || null), required: true }), _jsx("p", { className: "text-[11px] text-muted-foreground", children: "\u5BFE\u5FDC\u5F62\u5F0F: PDF, TXT, Markdown, CSV, JSON" })] }), _jsxs("div", { className: "flex items-center justify-end gap-2 pt-2 border-t", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowUploadModal(false), disabled: isUploading, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsxs(Button, { type: "submit", disabled: !selectedFile || isUploading, className: "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5", children: [_jsx(Upload, { className: "h-4 w-4" }), isUploading ? 'アップロード中...' : 'アップロード'] })] })] }) })), editingDoc && (_jsx(Dialog, { open: !!editingDoc, onClose: () => setEditingDoc(null), title: `ドキュメント編集: ${editingDoc.id}`, description: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u306E\u8868\u793A\u540D\u304A\u3088\u3073\u7A2E\u5225\uFF08\u30CA\u30EC\u30C3\u30B8/\u30DE\u30CB\u30E5\u30A2\u30EB\uFF09\u3092\u5909\u66F4\u3057\u307E\u3059\u3002", children: _jsxs("form", { onSubmit: handleUpdate, className: "space-y-4 text-xs", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "font-semibold text-foreground", children: ["\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u8868\u793A\u540D ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { value: editTitle, onChange: (e) => setEditTitle(e.target.value), placeholder: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u540D\u3092\u5165\u529B", required: true })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "font-semibold text-foreground", children: "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u7A2E\u5225" }), _jsxs("select", { value: editType, onChange: (e) => setEditType(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "knowledge", children: "\u30CA\u30EC\u30C3\u30B8\u30FB\u624B\u9806\u66F8 (AI\u53C2\u7167\u7528)" }), _jsx("option", { value: "manual", children: "\u5229\u7528\u8005\u30DE\u30CB\u30E5\u30A2\u30EB (\u30E6\u30FC\u30B6\u30FC\u95B2\u89A7\u30FB\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u7528)" })] })] }), _jsxs("div", { className: "rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1", children: [_jsxs("p", { children: ["\u5143\u30D5\u30A1\u30A4\u30EB\u540D: ", _jsx("span", { className: "font-mono", children: editingDoc.originalFileName })] }), _jsxs("p", { children: ["\u767B\u9332\u8005: ", editingDoc.uploadedBy] })] }), _jsxs("div", { className: "flex items-center justify-end gap-2 pt-2 border-t", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setEditingDoc(null), disabled: isUpdating, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsxs(Button, { type: "submit", disabled: isUpdating, className: "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5", children: [_jsx(Pencil, { className: "h-4 w-4" }), isUpdating ? '更新中...' : '更新保存'] })] })] }) }))] }));
};
