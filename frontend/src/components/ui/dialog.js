import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export function Dialog({ open, onClose, children, title, description, maxWidth = "max-w-xl", }) {
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        if (open) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in", onClick: onClose }), _jsxs("div", { className: cn("relative z-50 w-full overflow-hidden rounded-xl border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95", maxWidth), children: [_jsxs("button", { onClick: onClose, className: "absolute right-4 top-4 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring", children: [_jsx(X, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "\u9589\u3058\u308B" })] }), title && (_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight text-foreground", children: title }), description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: description }))] })), _jsx("div", { children: children })] })] }));
}
