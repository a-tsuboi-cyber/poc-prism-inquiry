import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
export const LoadingOverlay = ({ show, message = "処理中...", }) => {
    if (!show)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200", children: _jsxs("div", { className: "flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-2xl border text-center max-w-xs mx-4 animate-in zoom-in-95 duration-200", children: [_jsx(Loader2, { className: "h-10 w-10 animate-spin text-blue-600" }), _jsx("p", { className: "text-sm font-medium text-foreground", children: message }), _jsx("span", { className: "text-xs text-muted-foreground", children: "\u3057\u3070\u3089\u304F\u304A\u5F85\u3061\u304F\u3060\u3055\u3044" })] }) }));
};
