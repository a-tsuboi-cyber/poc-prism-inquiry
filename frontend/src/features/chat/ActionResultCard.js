import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
export const ActionResultCard = ({ type, title, description, metaText, onNewChat, }) => {
    const isResolved = type === 'resolved';
    return (_jsxs("div", { className: cn("my-4 rounded-xl border p-4 shadow-sm transition-all animate-in fade-in duration-300", isResolved
            ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
            : "border-red-200 bg-red-50/80 text-red-950"), children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm", isResolved
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"), children: isResolved ? (_jsx(CheckCircle2, { className: "h-5 w-5" })) : (_jsx(AlertTriangle, { className: "h-5 w-5" })) }), _jsxs("div", { className: "flex-1 space-y-1", children: [_jsx("h4", { className: "font-semibold text-sm leading-tight", children: title }), _jsx("p", { className: "text-xs opacity-90 leading-relaxed", children: description }), metaText && (_jsx("p", { className: "text-[11px] font-mono opacity-75 pt-0.5", children: metaText }))] })] }), _jsx("div", { className: "mt-3.5 flex justify-end border-t border-black/5 pt-3", children: _jsxs(Button, { size: "sm", onClick: onNewChat, className: cn("text-xs h-8 text-white shadow-sm flex items-center gap-1.5", isResolved
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-red-700 hover:bg-red-800"), children: [_jsx(RefreshCw, { className: "h-3.5 w-3.5" }), "\u65B0\u3057\u3044\u4F1A\u8A71\u3092\u958B\u59CB"] }) })] }));
};
