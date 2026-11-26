import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, FileText, MessageSquare } from 'lucide-react';
export const TicketDetailModal = ({ ticketId, open, onClose, onUpdated, }) => {
    const [ticket, setTicket] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            try {
                const data = await api.getTicketDetail(ticketId);
                setTicket(data.ticket);
                setConversation(data.conversation || null);
            }
            catch (err) {
                console.error('Failed to fetch ticket detail:', err);
            }
            finally {
                setIsLoading(false);
            }
        };
        if (ticketId && open) {
            fetchDetail();
        }
    }, [ticketId, open]);
    const handleStatusChange = async (newStatus) => {
        if (!ticket)
            return;
        try {
            const updated = await api.updateTicketStatus(ticket.id, newStatus);
            setTicket(updated);
            onUpdated();
        }
        catch (err) {
            console.error('Failed to update status:', err);
        }
    };
    if (!ticket && !isLoading)
        return null;
    return (_jsx(Dialog, { open: open, onClose: onClose, title: ticket ? `チケット詳細: ${ticket.id}` : 'チケット詳細', maxWidth: "max-w-3xl", children: isLoading || !ticket ? (_jsx("div", { className: "py-12 text-center text-xs text-muted-foreground", children: "\u30C1\u30B1\u30C3\u30C8\u60C5\u5831\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." })) : (_jsxs("div", { className: "space-y-4 text-xs", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3.5 border", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "font-bold text-sm text-foreground", children: ticket.subject }), _jsxs(Badge, { variant: ticket.urgency === '高' ? 'destructive' : 'default', children: ["\u7DCA\u6025\u5EA6: ", ticket.urgency] }), _jsxs(Badge, { variant: "outline", children: ["\u30AB\u30C6\u30B4\u30EA: ", ticket.category] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-muted-foreground mr-1", children: "\u72B6\u614B\u5909\u66F4:" }), _jsx(Button, { size: "sm", variant: ticket.status === '新規' ? 'default' : 'outline', onClick: () => handleStatusChange('新規'), className: "h-7 text-xs px-2.5", children: "\u65B0\u898F" }), _jsx(Button, { size: "sm", variant: ticket.status === '対応中' ? 'default' : 'outline', onClick: () => handleStatusChange('対応中'), className: "h-7 text-xs px-2.5", children: "\u5BFE\u5FDC\u4E2D" }), _jsx(Button, { size: "sm", variant: ticket.status === '完了' ? 'success' : 'outline', onClick: () => handleStatusChange('完了'), className: "h-7 text-xs px-2.5", children: "\u5B8C\u4E86" })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-3", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "\u8D77\u7968\u8005:" }), ' ', _jsx("span", { className: "font-medium text-foreground", children: ticket.user ? `${ticket.user.name} (${ticket.user.email})` : '未登録' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "\u8D77\u7968\u65E5\u6642:" }), ' ', _jsx("span", { className: "font-medium text-foreground", children: new Date(ticket.createdAt).toLocaleString('ja-JP') })] }), ticket.phoneNumber && (_jsxs("div", { className: "sm:col-span-2 flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 p-2 rounded-md", children: [_jsx(Phone, { className: "h-4 w-4 text-amber-600" }), _jsxs("span", { children: ["\u7DCA\u6025\u9023\u7D61\u5148\u96FB\u8A71\u756A\u53F7: ", ticket.phoneNumber] })] }))] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("h4", { className: "font-semibold text-foreground flex items-center gap-1.5", children: [_jsx(FileText, { className: "h-4 w-4 text-blue-600" }), "\u554F\u3044\u5408\u308F\u305B\u8A73\u7D30 / \u3084\u308A\u53D6\u308A\u8981\u7D04"] }), _jsx("div", { className: "rounded-lg border bg-card p-3.5 whitespace-pre-wrap leading-relaxed text-foreground", children: ticket.detail })] }), conversation && (_jsxs("div", { className: "space-y-1.5 pt-2", children: [_jsxs("h4", { className: "font-semibold text-foreground flex items-center gap-1.5", children: [_jsx(MessageSquare, { className: "h-4 w-4 text-indigo-600" }), "AI\u4E00\u6B21\u53D7\u3051\u3068\u306E\u5BFE\u8A71\u30ED\u30B0 (", conversation.messages.length, "\u4EF6)"] }), _jsx("div", { className: "max-h-56 overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3", children: conversation.messages.map((m, idx) => (_jsxs("div", { className: `p-2.5 rounded-lg text-xs leading-relaxed ${m.sender === 'user'
                                    ? 'bg-blue-50 text-blue-950 border border-blue-100 ml-4'
                                    : 'bg-card text-foreground border mr-4'}`, children: [_jsxs("div", { className: "flex justify-between items-center text-[10px] text-muted-foreground pb-1", children: [_jsx("span", { className: "font-semibold", children: m.sender === 'user' ? 'ユーザー' : 'PRISM AI' }), _jsx("span", { children: m.timestamp })] }), _jsx("div", { children: m.text })] }, idx))) })] })), _jsx("div", { className: "flex justify-end pt-2 border-t", children: _jsx(Button, { variant: "outline", size: "sm", onClick: onClose, children: "\u9589\u3058\u308B" }) })] })) }));
};
