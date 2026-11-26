import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TicketDetailModal } from './TicketDetailModal';
import { Filter, Eye, RefreshCw } from 'lucide-react';
export const TicketManagement = ({ initialTicketId }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterUrgency, setFilterUrgency] = useState('all');
    const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId || null);
    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const data = await api.getTickets({
                status: filterStatus !== 'all' ? filterStatus : undefined,
                urgency: filterUrgency !== 'all' ? filterUrgency : undefined,
            });
            setTickets(data);
        }
        catch (err) {
            console.error('Failed to fetch tickets:', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchTickets();
    }, [filterStatus, filterUrgency]);
    useEffect(() => {
        if (initialTicketId) {
            setSelectedTicketId(initialTicketId);
        }
    }, [initialTicketId]);
    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case '高':
                return _jsx(Badge, { variant: "destructive", children: "\u9AD8" });
            case '中':
                return _jsx(Badge, { variant: "warning", children: "\u4E2D" });
            default:
                return _jsx(Badge, { variant: "secondary", children: "\u4F4E" });
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case '新規':
                return _jsx(Badge, { className: "bg-blue-600 text-white", children: "\u65B0\u898F" });
            case '対応中':
                return _jsx(Badge, { className: "bg-amber-600 text-white", children: "\u5BFE\u5FDC\u4E2D" });
            case '完了':
                return _jsx(Badge, { className: "bg-emerald-600 text-white", children: "\u5B8C\u4E86" });
            default:
                return _jsx(Badge, { variant: "outline", children: status });
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "\u7D5E\u308A\u8FBC\u307F:" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring", children: [_jsx("option", { value: "all", children: "\u30B9\u30C6\u30FC\u30BF\u30B9: \u3059\u3079\u3066" }), _jsx("option", { value: "\u65B0\u898F", children: "\u65B0\u898F" }), _jsx("option", { value: "\u5BFE\u5FDC\u4E2D", children: "\u5BFE\u5FDC\u4E2D" }), _jsx("option", { value: "\u5B8C\u4E86", children: "\u5B8C\u4E86" })] }), _jsxs("select", { value: filterUrgency, onChange: (e) => setFilterUrgency(e.target.value), className: "h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring", children: [_jsx("option", { value: "all", children: "\u7DCA\u6025\u5EA6: \u3059\u3079\u3066" }), _jsx("option", { value: "\u9AD8", children: "\u9AD8" }), _jsx("option", { value: "\u4E2D", children: "\u4E2D" }), _jsx("option", { value: "\u4F4E", children: "\u4F4E" })] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: fetchTickets, className: "text-xs h-8 flex items-center gap-1.5", children: [_jsx(RefreshCw, { className: `h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}` }), "\u518D\u8AAD\u307F\u8FBC\u307F"] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base", children: ["\u30C1\u30B1\u30C3\u30C8\u4E00\u89A7 (", tickets.length, "\u4EF6)"] }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Teams Webhook\u9023\u643A\u4E2D" })] }) }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "border-y bg-muted/40 font-medium text-muted-foreground", children: _jsxs("tr", { children: [_jsx("th", { className: "py-3 px-4", children: "\u30C1\u30B1\u30C3\u30C8ID" }), _jsx("th", { className: "py-3 px-4", children: "\u7DCA\u6025\u5EA6" }), _jsx("th", { className: "py-3 px-4", children: "\u30B9\u30C6\u30FC\u30BF\u30B9" }), _jsx("th", { className: "py-3 px-4", children: "\u4EF6\u540D" }), _jsx("th", { className: "py-3 px-4", children: "\u8D77\u7968\u8005" }), _jsx("th", { className: "py-3 px-4", children: "\u30AB\u30C6\u30B4\u30EA" }), _jsx("th", { className: "py-3 px-4", children: "\u8D77\u7968\u65E5\u6642" }), _jsx("th", { className: "py-3 px-4 text-right", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { className: "divide-y divide-border", children: tickets.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "py-8 text-center text-muted-foreground", children: "\u8A72\u5F53\u3059\u308B\u30C1\u30B1\u30C3\u30C8\u306F\u3042\u308A\u307E\u305B\u3093" }) })) : (tickets.map((t) => (_jsxs("tr", { className: "hover:bg-muted/30 transition-colors cursor-pointer", onClick: () => setSelectedTicketId(t.id), children: [_jsx("td", { className: "py-3 px-4 font-mono font-medium text-blue-600", children: t.id }), _jsx("td", { className: "py-3 px-4", children: getUrgencyBadge(t.urgency) }), _jsx("td", { className: "py-3 px-4", children: getStatusBadge(t.status) }), _jsx("td", { className: "py-3 px-4 font-medium text-foreground max-w-xs truncate", children: t.subject }), _jsx("td", { className: "py-3 px-4 text-muted-foreground", children: t.user ? t.user.name : '-' }), _jsx("td", { className: "py-3 px-4", children: t.category }), _jsx("td", { className: "py-3 px-4 text-muted-foreground", children: new Date(t.createdAt).toLocaleString('ja-JP') }), _jsx("td", { className: "py-3 px-4 text-right", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                            e.stopPropagation();
                                                            setSelectedTicketId(t.id);
                                                        }, className: "h-7 text-xs flex items-center gap-1", children: [_jsx(Eye, { className: "h-3.5 w-3.5" }), "\u8A73\u7D30"] }) })] }, t.id)))) })] }) }) })] }), selectedTicketId && (_jsx(TicketDetailModal, { ticketId: selectedTicketId, open: Boolean(selectedTicketId), onClose: () => setSelectedTicketId(null), onUpdated: fetchTickets }))] }));
};
