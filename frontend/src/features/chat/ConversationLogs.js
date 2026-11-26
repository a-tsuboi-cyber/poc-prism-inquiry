import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { RefreshCw, Eye, Sparkles } from 'lucide-react';
export const ConversationLogs = () => {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedConv, setSelectedConv] = useState(null);
    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            const data = await api.getConversations();
            setConversations(data);
        }
        catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchConversations();
    }, []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: "\u3084\u308A\u53D6\u308A\u30ED\u30B0\u5C65\u6B74" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u30E6\u30FC\u30B6\u30FC\u3068AI\u306E\u5168\u30C1\u30E3\u30C3\u30C8\u30BB\u30C3\u30B7\u30E7\u30F3\u304A\u3088\u3073\u81EA\u5DF1\u89E3\u6C7A\u30FB\u30A8\u30B9\u30AB\u30EC\u30FC\u30B7\u30E7\u30F3\u306E\u72B6\u6CC1" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: fetchConversations, className: "text-xs h-8 flex items-center gap-1.5", children: [_jsx(RefreshCw, { className: `h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}` }), "\u518D\u8AAD\u307F\u8FBC\u307F"] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-base", children: ["\u5168\u30BB\u30C3\u30B7\u30E7\u30F3\u4E00\u89A7 (", conversations.length, "\u4EF6)"] }) }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "border-y bg-muted/40 font-medium text-muted-foreground", children: _jsxs("tr", { children: [_jsx("th", { className: "py-3 px-4", children: "\u30BB\u30C3\u30B7\u30E7\u30F3ID" }), _jsx("th", { className: "py-3 px-4", children: "\u30B9\u30C6\u30FC\u30BF\u30B9" }), _jsx("th", { className: "py-3 px-4", children: "\u30E6\u30FC\u30B6\u30FC" }), _jsx("th", { className: "py-3 px-4", children: "\u554F\u3044\u5408\u308F\u305B\u30C8\u30D4\u30C3\u30AF" }), _jsx("th", { className: "py-3 px-4", children: "\u767A\u8A71\u6570" }), _jsx("th", { className: "py-3 px-4", children: "\u30CA\u30EC\u30C3\u30B8\u5019\u88DC" }), _jsx("th", { className: "py-3 px-4", children: "\u958B\u59CB\u65E5\u6642" }), _jsx("th", { className: "py-3 px-4 text-right", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { className: "divide-y divide-border", children: conversations.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "py-8 text-center text-muted-foreground", children: "\u5BFE\u8A71\u30ED\u30B0\u306F\u3042\u308A\u307E\u305B\u3093" }) })) : (conversations.map((c) => (_jsxs("tr", { className: "hover:bg-muted/30 transition-colors cursor-pointer", onClick: () => setSelectedConv(c), children: [_jsx("td", { className: "py-3 px-4 font-mono font-medium text-blue-600", children: c.sessionId }), _jsx("td", { className: "py-3 px-4", children: _jsx(Badge, { variant: c.status === 'クローズ（自己解決）'
                                                            ? 'success'
                                                            : c.status === 'エスカレーション'
                                                                ? 'destructive'
                                                                : 'secondary', children: c.status }) }), _jsx("td", { className: "py-3 px-4 font-medium text-foreground", children: c.user ? c.user.name : '-' }), _jsx("td", { className: "py-3 px-4 max-w-xs truncate text-muted-foreground", children: c.topic || '-' }), _jsxs("td", { className: "py-3 px-4 text-muted-foreground", children: [c.messages.length, "\u4EF6"] }), _jsx("td", { className: "py-3 px-4", children: c.isKnowledgeCandidate ? (_jsxs(Badge, { variant: "warning", className: "text-[10px]", children: [_jsx(Sparkles, { className: "h-3 w-3 mr-1" }), "\u5019\u88DC"] })) : (_jsx("span", { className: "text-muted-foreground", children: "-" })) }), _jsx("td", { className: "py-3 px-4 text-muted-foreground", children: new Date(c.startedAt).toLocaleString('ja-JP') }), _jsx("td", { className: "py-3 px-4 text-right", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                            e.stopPropagation();
                                                            setSelectedConv(c);
                                                        }, className: "h-7 text-xs flex items-center gap-1", children: [_jsx(Eye, { className: "h-3.5 w-3.5" }), "\u30ED\u30B0"] }) })] }, c.sessionId)))) })] }) }) })] }), selectedConv && (_jsx(Dialog, { open: Boolean(selectedConv), onClose: () => setSelectedConv(null), title: `対話ログ詳細: ${selectedConv.sessionId}`, maxWidth: "max-w-2xl", children: _jsxs("div", { className: "space-y-4 text-xs", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between rounded-lg bg-muted/40 p-3 border", children: [_jsxs("div", { children: ["\u30E6\u30FC\u30B6\u30FC: ", _jsx("span", { className: "font-semibold text-foreground", children: selectedConv.user.name })] }), _jsx(Badge, { variant: "outline", children: selectedConv.status })] }), _jsx("div", { className: "max-h-80 overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3", children: selectedConv.messages.map((m, idx) => (_jsxs("div", { className: `p-3 rounded-lg leading-relaxed ${m.sender === 'user'
                                    ? 'bg-blue-50 text-blue-950 border border-blue-100 ml-6'
                                    : 'bg-card text-foreground border mr-6'}`, children: [_jsxs("div", { className: "flex justify-between items-center text-[10px] text-muted-foreground pb-1", children: [_jsx("span", { className: "font-semibold", children: m.sender === 'user' ? 'ユーザー' : 'PRISM AI' }), _jsx("span", { children: m.timestamp })] }), _jsx("div", { className: "whitespace-pre-wrap", children: m.text })] }, idx))) }), _jsx("div", { className: "flex justify-end pt-2 border-t", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => setSelectedConv(null), children: "\u9589\u3058\u308B" }) })] }) }))] }));
};
