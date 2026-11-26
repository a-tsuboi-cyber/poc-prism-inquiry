import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Save } from 'lucide-react';
export const KnowledgeDetailModal = ({ open, knowledge, isNew = false, onClose, onSaved, }) => {
    const [category, setCategory] = useState(knowledge?.category || '一般');
    const [question, setQuestion] = useState(knowledge?.question || '');
    const [answer, setAnswer] = useState(knowledge?.answer || '');
    const [tags, setTags] = useState(knowledge?.tags?.join(', ') || '');
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => {
        if (knowledge) {
            setCategory(knowledge.category);
            setQuestion(knowledge.question);
            setAnswer(knowledge.answer);
            setTags(knowledge.tags?.join(', ') || '');
        }
        else {
            setCategory('一般');
            setQuestion('');
            setAnswer('');
            setTags('');
        }
    }, [knowledge, isNew]);
    const handleSave = async (e) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim())
            return;
        setIsSaving(true);
        try {
            const tagArray = tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
            if (isNew) {
                await api.createKnowledge({
                    category,
                    question: question.trim(),
                    answer: answer.trim(),
                    tags: tagArray,
                });
            }
            else if (knowledge) {
                await api.updateKnowledge(knowledge.id, {
                    category,
                    question: question.trim(),
                    answer: answer.trim(),
                    tags: tagArray,
                });
            }
            onSaved();
        }
        catch (err) {
            console.error('Failed to save knowledge:', err);
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsx(Dialog, { open: open, onClose: onClose, title: isNew ? 'ナレッジ新規登録' : `ナレッジ編集: ${knowledge?.id}`, description: "\u767B\u9332\u30FB\u66F4\u65B0\u6642\u306BGemini AI\u304C\u5185\u5BB9\u3092\u5206\u6790\u3057\u3001\u81EA\u5DF1\u89E3\u6C7A\u7387\u3092\u9AD8\u3081\u308B\u6539\u5584\u30D2\u30F3\u30C8\u3092\u81EA\u52D5\u751F\u6210\u3057\u307E\u3059\u3002", maxWidth: "max-w-2xl", children: _jsxs("form", { onSubmit: handleSave, className: "space-y-4 text-xs", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "font-semibold text-foreground", children: "\u30AB\u30C6\u30B4\u30EA" }), _jsxs("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: [_jsx("option", { value: "\u4E00\u822C", children: "\u4E00\u822C" }), _jsx("option", { value: "\u30B7\u30B9\u30C6\u30E0\u4E0D\u5177\u5408", children: "\u30B7\u30B9\u30C6\u30E0\u4E0D\u5177\u5408" }), _jsx("option", { value: "\u30A2\u30AB\u30A6\u30F3\u30C8\u30FB\u6A29\u9650", children: "\u30A2\u30AB\u30A6\u30F3\u30C8\u30FB\u6A29\u9650" }), _jsx("option", { value: "\u64CD\u4F5C\u65B9\u6CD5", children: "\u64CD\u4F5C\u65B9\u6CD5" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "font-semibold text-foreground", children: "\u691C\u7D22\u30BF\u30B0 (\u30AB\u30F3\u30DE\u533A\u5207\u308A)" }), _jsx(Input, { value: tags, onChange: (e) => setTags(e.target.value), placeholder: "\u4F8B: \u30D1\u30B9\u30EF\u30FC\u30C9, \u30ED\u30C3\u30AF, \u7533\u8ACB" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "font-semibold text-foreground", children: ["\u8CEA\u554F / \u554F\u3044\u5408\u308F\u305B\u5185\u5BB9 ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { value: question, onChange: (e) => setQuestion(e.target.value), placeholder: "\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u60F3\u5B9A\u3055\u308C\u308B\u554F\u3044\u5408\u308F\u305B\u5185\u5BB9", required: true })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "font-semibold text-foreground", children: ["\u56DE\u7B54\u5185\u5BB9 / \u89E3\u6C7A\u624B\u9806 ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Textarea, { value: answer, onChange: (e) => setAnswer(e.target.value), rows: 6, placeholder: "\u81EA\u5DF1\u89E3\u6C7A\u306E\u305F\u3081\u306E\u6848\u5185\u624B\u9806\u3084\u30EA\u30F3\u30AF\u306A\u3069", required: true })] }), !isNew && knowledge?.aiHints && (_jsxs("div", { className: "rounded-lg border border-blue-200 bg-blue-50/60 p-3", children: [_jsxs("div", { className: "flex items-center gap-1.5 font-semibold text-blue-900 pb-1", children: [_jsx(Sparkles, { className: "h-4 w-4 text-blue-600" }), _jsx("span", { children: "AI\u54C1\u8CEA\u6539\u5584\u30D2\u30F3\u30C8" })] }), _jsx("p", { className: "text-blue-950 leading-relaxed", children: knowledge.aiHints })] })), _jsxs("div", { className: "flex items-center justify-end gap-2 pt-2 border-t", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: isSaving, children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsxs(Button, { type: "submit", disabled: isSaving, className: "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5", children: [_jsx(Save, { className: "h-4 w-4" }), isSaving ? '保存中...' : '保存'] })] })] }) }));
};
