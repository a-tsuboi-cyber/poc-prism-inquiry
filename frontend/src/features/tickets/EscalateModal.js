import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Phone, AlertCircle, Sparkles } from 'lucide-react';
export const EscalateModal = ({ open, onClose, sessionId, currentUser, initialSummary, onSuccess, }) => {
    const [subject, setSubject] = useState(initialSummary?.subject || '');
    const [category, setCategory] = useState(initialSummary?.category || '一般');
    const [urgency, setUrgency] = useState(initialSummary?.urgency || '中');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [detail, setDetail] = useState(initialSummary?.detail || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (initialSummary) {
            if (initialSummary.subject)
                setSubject(initialSummary.subject);
            if (initialSummary.category)
                setCategory(initialSummary.category);
            if (initialSummary.urgency)
                setUrgency(initialSummary.urgency);
            if (initialSummary.detail)
                setDetail(initialSummary.detail);
        }
    }, [initialSummary]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subject.trim()) {
            setError('件名を入力してください');
            return;
        }
        if (!category.trim()) {
            setError('カテゴリを選択してください（必須）');
            return;
        }
        if (!detail.trim()) {
            setError('問い合わせ詳細を入力してください');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const ticket = await api.createTicket({
                sessionId,
                subject: subject.trim(),
                category,
                urgency,
                phoneNumber: urgency === '高' ? phoneNumber.trim() : undefined,
                detail: detail.trim(),
                linkedKnowledgeId: initialSummary?.linkedKnowledgeId,
                user: { name: currentUser.name, email: currentUser.email },
            });
            onSuccess(ticket.id);
        }
        catch (err) {
            console.error('Failed to escalate ticket:', err);
            setError(err.message || 'チケットの起票に失敗しました');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx(Dialog, { open: open, onClose: onClose, title: "\u30B5\u30DD\u30FC\u30C8\u62C5\u5F53\u8005\u3078\u30A8\u30B9\u30AB\u30EC\u30FC\u30B7\u30E7\u30F3", description: "\u3053\u308C\u307E\u3067\u306E\u4F1A\u8A71\u5185\u5BB9\u3092\u5143\u306B\u554F\u3044\u5408\u308F\u305B\u8981\u7D04\u3092\u751F\u6210\u3057\u307E\u3057\u305F\u3002\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u4FEE\u6B63\u3057\u3001\u9001\u4FE1\u3057\u3066\u304F\u3060\u3055\u3044\u3002", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4 shrink-0" }), _jsx("span", { children: error })] })), _jsxs("div", { className: "rounded-lg bg-muted/40 p-3 text-xs flex justify-between items-center text-muted-foreground border", children: [_jsxs("div", { children: ["\u8D77\u7968\u8005: ", _jsx("span", { className: "font-semibold text-foreground", children: currentUser.name }), " (", currentUser.email, ")"] }), _jsxs("span", { className: "flex items-center gap-1 text-[11px] text-blue-600 font-medium", children: [_jsx(Sparkles, { className: "h-3 w-3" }), "AI\u81EA\u52D5\u8981\u7D04\u9023\u643A"] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-semibold text-foreground", children: ["\u4EF6\u540D ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "\u4F8B: \u3010\u554F\u3044\u5408\u308F\u305B\u3011504\u30A8\u30E9\u30FC\u3067\u753B\u9762\u304C\u8868\u793A\u3055\u308C\u306A\u3044", required: true })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-semibold text-foreground", children: ["\u30AB\u30C6\u30B4\u30EA ", _jsx("span", { className: "text-red-500", children: "* (\u5FC5\u9808)" })] }), _jsxs("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", required: true, children: [_jsx("option", { value: "\u4E00\u822C", children: "\u4E00\u822C" }), _jsx("option", { value: "\u30B7\u30B9\u30C6\u30E0\u4E0D\u5177\u5408", children: "\u30B7\u30B9\u30C6\u30E0\u4E0D\u5177\u5408" }), _jsx("option", { value: "\u30A2\u30AB\u30A6\u30F3\u30C8\u30FB\u6A29\u9650", children: "\u30A2\u30AB\u30A6\u30F3\u30C8\u30FB\u6A29\u9650" }), _jsx("option", { value: "\u64CD\u4F5C\u65B9\u6CD5", children: "\u64CD\u4F5C\u65B9\u6CD5" }), _jsx("option", { value: "\u305D\u306E\u4ED6", children: "\u305D\u306E\u4ED6" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-foreground", children: "\u7DCA\u6025\u5EA6" }), _jsxs("select", { value: urgency, onChange: (e) => setUrgency(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "\u4F4E", children: "\u4F4E (\u6570\u55B6\u696D\u65E5\u4EE5\u5185\u3067\u53EF)" }), _jsx("option", { value: "\u4E2D", children: "\u4E2D (\u5F53\u65E5\u4E2D)" }), _jsx("option", { value: "\u9AD8", children: "\u9AD8 (\u7DCA\u6025\u30FB\u696D\u52D9\u505C\u6B62\u30EA\u30B9\u30AF)" })] })] })] }), urgency === '高' && (_jsxs("div", { className: "space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 animate-in fade-in duration-200", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "text-xs font-semibold text-amber-900 flex items-center gap-1.5", children: [_jsx(Phone, { className: "h-3.5 w-3.5 text-amber-600" }), "\u7DCA\u6025\u9023\u7D61\u5148\u96FB\u8A71\u756A\u53F7 (\u4EFB\u610F)"] }), _jsx("span", { className: "text-[10px] text-amber-700", children: "\u7DCA\u6025\u5EA6\u300C\u9AD8\u300D\u5C02\u7528" })] }), _jsx(Input, { type: "tel", value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value), placeholder: "\u4F8B: 090-1234-5678 (\u81F3\u6025\u9023\u7D61\u304C\u5FC5\u8981\u306A\u5834\u5408\u306B\u3054\u8A18\u5165\u304F\u3060\u3055\u3044)", className: "bg-white" }), _jsx("p", { className: "text-[11px] text-amber-800", children: "\u203B \u7DCA\u6025\u5EA6\u300C\u9AD8\u300D\u304C\u9078\u629E\u3055\u308C\u3066\u3044\u308B\u305F\u3081\u3001\u62C5\u5F53\u8005\u3088\u308A\u81F3\u6025\u304A\u96FB\u8A71\u3092\u5DEE\u3057\u4E0A\u3052\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002" })] })), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "text-xs font-semibold text-foreground", children: ["\u554F\u3044\u5408\u308F\u305B\u8A73\u7D30 ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("span", { className: "text-[11px] text-muted-foreground", children: "\u203BAI\u304C\u30E6\u30FC\u30B6\u30FC\u8996\u70B9\u3067\u8981\u7D04\u6E08\u307F" })] }), _jsx(Textarea, { value: detail, onChange: (e) => setDetail(e.target.value), rows: 5, className: "text-xs leading-relaxed", placeholder: "\u56F0\u3063\u3066\u3044\u308B\u5185\u5BB9\u3001\u767A\u751F\u3057\u3066\u3044\u308B\u30A8\u30E9\u30FC\u3001\u8A66\u3057\u305F\u624B\u9806\u306A\u3069\u3092\u8A73\u3057\u304F\u3054\u8A18\u5165\u304F\u3060\u3055\u3044\u3002", required: true })] }), _jsxs("div", { className: "flex items-center justify-end gap-2 pt-2 border-t", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: isSubmitting, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsxs(Button, { type: "submit", disabled: isSubmitting, className: "bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5", children: [_jsx(Send, { className: "h-4 w-4" }), isSubmitting ? '送信中...' : 'チケット起票 & Teams通知'] })] })] }) }));
};
