import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KnowledgeDetailModal } from './KnowledgeDetailModal';
import { Plus, Search, Edit2, Sparkles } from 'lucide-react';
export const KnowledgeManagement = () => {
    const [knowledgeList, setKnowledgeList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingKnowledge, setEditingKnowledge] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const fetchKnowledge = async (q) => {
        setIsLoading(true);
        try {
            const data = await api.getKnowledge(q);
            setKnowledgeList(data);
        }
        catch (err) {
            console.error('Failed to fetch knowledge:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchKnowledge();
    }, []);
    const handleSearch = (e) => {
        e.preventDefault();
        fetchKnowledge(searchQuery);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm", children: [_jsxs("form", { onSubmit: handleSearch, className: "flex items-center gap-2 flex-1 max-w-md", children: [_jsx(Input, { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "\u30CA\u30EC\u30C3\u30B8\u3092\u30AD\u30FC\u30EF\u30FC\u30C9\u3067\u691C\u7D22...", className: "h-8 text-xs" }), _jsxs(Button, { type: "submit", variant: "outline", size: "sm", className: "h-8 text-xs flex items-center gap-1", children: [_jsx(Search, { className: "h-3.5 w-3.5" }), "\u691C\u7D22"] })] }), _jsxs(Button, { size: "sm", onClick: () => setIsCreating(true), className: "text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5", children: [_jsx(Plus, { className: "h-4 w-4" }), "\u30CA\u30EC\u30C3\u30B8\u65B0\u898F\u767B\u9332"] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base", children: ["\u767B\u9332\u30CA\u30EC\u30C3\u30B8\u4E00\u89A7 (", knowledgeList.length, "\u4EF6)"] }), _jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(Sparkles, { className: "h-3.5 w-3.5 text-blue-600" }), "Gemini AI\u6539\u5584\u30D2\u30F3\u30C8\u9023\u643A\u5BFE\u5FDC"] })] }) }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "border-y bg-muted/40 font-medium text-muted-foreground", children: _jsxs("tr", { children: [_jsx("th", { className: "py-3 px-4", children: "ID" }), _jsx("th", { className: "py-3 px-4", children: "\u30AB\u30C6\u30B4\u30EA" }), _jsx("th", { className: "py-3 px-4", children: "\u8CEA\u554F / \u554F\u3044\u5408\u308F\u305B\u5185\u5BB9" }), _jsx("th", { className: "py-3 px-4", children: "\u30BF\u30B0" }), _jsx("th", { className: "py-3 px-4", children: "\u53C2\u7167\u56DE\u6570" }), _jsx("th", { className: "py-3 px-4", children: "AI\u30D2\u30F3\u30C8" }), _jsx("th", { className: "py-3 px-4 text-right", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { className: "divide-y divide-border", children: knowledgeList.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "py-8 text-center text-muted-foreground", children: "\u767B\u9332\u3055\u308C\u3066\u3044\u308B\u30CA\u30EC\u30C3\u30B8\u306F\u3042\u308A\u307E\u305B\u3093" }) })) : (knowledgeList.map((k) => (_jsxs("tr", { className: "hover:bg-muted/30 transition-colors cursor-pointer", onClick: () => setEditingKnowledge(k), children: [_jsx("td", { className: "py-3 px-4 font-mono font-medium text-blue-600", children: k.id }), _jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: "outline", children: k.category }) }), _jsx("td", { className: "py-3 px-4 font-medium text-foreground max-w-sm truncate", children: k.question }), _jsx("td", { className: "py-3 px-4", children: _jsx("div", { className: "flex flex-wrap gap-1", children: k.tags?.map((t, idx) => (_jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground", children: t }, idx))) }) }), _jsxs("td", { className: "py-3 px-4 text-muted-foreground", children: [k.usageCount || 0, "\u56DE"] }), _jsx("td", { className: "py-3 px-4 max-w-xs truncate text-muted-foreground", children: k.aiHints ? (_jsxs("span", { className: "text-blue-600 flex items-center gap-1", children: [_jsx(Sparkles, { className: "h-3 w-3 shrink-0" }), k.aiHints.slice(0, 30), "..."] })) : ('-') }), _jsx("td", { className: "py-3 px-4 text-right", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                            e.stopPropagation();
                                                            setEditingKnowledge(k);
                                                        }, className: "h-7 text-xs flex items-center gap-1", children: [_jsx(Edit2, { className: "h-3.5 w-3.5" }), "\u7DE8\u96C6"] }) })] }, k.id)))) })] }) }) })] }), (editingKnowledge || isCreating) && (_jsx(KnowledgeDetailModal, { open: Boolean(editingKnowledge || isCreating), knowledge: editingKnowledge, isNew: isCreating, onClose: () => {
                    setEditingKnowledge(null);
                    setIsCreating(false);
                }, onSaved: () => {
                    setEditingKnowledge(null);
                    setIsCreating(false);
                    fetchKnowledge();
                } }))] }));
};
