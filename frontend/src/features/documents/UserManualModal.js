import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, BookOpen } from 'lucide-react';
export const UserManualModal = ({ open, onClose }) => {
    const [manuals, setManuals] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            api
                .getDocuments({ type: 'manual' })
                .then((docs) => setManuals(docs))
                .catch((err) => console.error('Failed to fetch manuals:', err))
                .finally(() => setIsLoading(false));
        }
    }, [open]);
    return (_jsx(Dialog, { open: open, onClose: onClose, title: "PRISM \u30B7\u30B9\u30C6\u30E0\u30DE\u30CB\u30E5\u30A2\u30EB\u30FB\u624B\u9806\u66F8\u4E00\u89A7", description: "\u767B\u9332\u3055\u308C\u3066\u3044\u308B\u6700\u65B0\u306E\u5229\u7528\u8005\u5411\u3051\u30DE\u30CB\u30E5\u30A2\u30EB\u3084\u64CD\u4F5C\u624B\u9806\u66F8\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3057\u3066\u3054\u78BA\u8A8D\u3044\u305F\u3060\u3051\u307E\u3059\u3002", maxWidth: "max-w-2xl", children: _jsxs("div", { className: "space-y-4 text-xs", children: [isLoading ? (_jsx("div", { className: "py-8 text-center text-muted-foreground", children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) : manuals.length === 0 ? (_jsx("div", { className: "py-8 text-center text-muted-foreground", children: "\u73FE\u5728\u516C\u958B\u3055\u308C\u3066\u3044\u308B\u30DE\u30CB\u30E5\u30A2\u30EB\u306F\u3042\u308A\u307E\u305B\u3093\u3002" })) : (_jsx("div", { className: "divide-y divide-border rounded-xl border bg-card", children: manuals.map((m) => (_jsxs("div", { className: "flex items-center justify-between p-3.5 hover:bg-muted/20", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700", children: _jsx(BookOpen, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-foreground text-sm", children: m.title }), _jsxs("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: ["\u30D5\u30A1\u30A4\u30EB\u540D: ", m.originalFileName, " (", Math.round(m.fileSize / 1024), " KB)"] })] })] }), _jsxs("a", { href: api.getDocumentDownloadUrl(m.id), download: true, className: "inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground", children: [_jsx(Download, { className: "h-3.5 w-3.5" }), "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9"] })] }, m.id))) })), _jsx("div", { className: "flex justify-end pt-2 border-t", children: _jsx(Button, { variant: "outline", size: "sm", onClick: onClose, children: "\u9589\u3058\u308B" }) })] }) }));
};
