import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ChatView } from '@/features/chat/ChatView';
import { TicketManagement } from '@/features/tickets/TicketManagement';
import { ConversationLogs } from '@/features/chat/ConversationLogs';
import { KnowledgeManagement } from '@/features/knowledge/KnowledgeManagement';
import { DocumentManagement } from '@/features/documents/DocumentManagement';
import { UserManualModal } from '@/features/documents/UserManualModal';
import { Ticket, MessageSquare, BookOpen, FileText } from 'lucide-react';
export function App() {
    // 初期ユーザー（坪井 太郎）
    const [currentUser, setCurrentUser] = useState({
        name: '坪井 太郎',
        email: 'a-tsuboi@ntv.co.jp',
        role: 'user', // デフォルトは一般ユーザ
    });
    // チャットセッションID
    const [sessionId, setSessionId] = useState(() => `SES-${Date.now()}`);
    // 管理画面のアクティブタブ
    const [adminTab, setAdminTab] = useState('tickets');
    // URLパラメータからのチケットID自動オープン（Teams連携リンク）
    const [initialTicketId, setInitialTicketId] = useState(null);
    // マニュアルモーダル
    const [showManualModal, setShowManualModal] = useState(false);
    // URLクエリパラメータの解釈
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const ticketParam = params.get('ticketId');
        if (viewParam === 'admin') {
            setCurrentUser((prev) => ({ ...prev, role: 'admin' }));
            if (ticketParam) {
                setInitialTicketId(ticketParam);
                setAdminTab('tickets');
            }
        }
    }, []);
    // ロール切り替え
    const handleRoleSwitch = (newRole) => {
        setCurrentUser((prev) => ({ ...prev, role: newRole }));
    };
    // 新しい会話を開始
    const handleNewChat = () => {
        setSessionId(`SES-${Date.now()}`);
        // 一般ユーザー画面に切り替え
        if (currentUser.role === 'admin') {
            setCurrentUser((prev) => ({ ...prev, role: 'user' }));
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background font-sans antialiased flex flex-col", children: [_jsx(Header, { currentUser: currentUser, onRoleSwitch: handleRoleSwitch, onNewChat: handleNewChat, onOpenManual: () => setShowManualModal(true) }), _jsx("main", { className: "flex-1 flex flex-col", children: currentUser.role === 'user' ? (_jsx(ChatView, { currentUser: currentUser, onNewChat: handleNewChat, sessionId: sessionId })) : (_jsxs("div", { className: "container mx-auto px-4 py-6 sm:px-6 max-w-7xl", children: [_jsxs("div", { className: "mb-6 flex border-b border-border/80", children: [_jsxs("button", { onClick: () => setAdminTab('tickets'), className: `flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${adminTab === 'tickets'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(Ticket, { className: "h-4 w-4" }), "\u30C1\u30B1\u30C3\u30C8\u7BA1\u7406"] }), _jsxs("button", { onClick: () => setAdminTab('conversations'), className: `flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${adminTab === 'conversations'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(MessageSquare, { className: "h-4 w-4" }), "\u3084\u308A\u53D6\u308A\u30ED\u30B0\u5C65\u6B74"] }), _jsxs("button", { onClick: () => setAdminTab('knowledge'), className: `flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${adminTab === 'knowledge'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(BookOpen, { className: "h-4 w-4" }), "\u30CA\u30EC\u30C3\u30B8\u7BA1\u7406"] }), _jsxs("button", { onClick: () => setAdminTab('documents'), className: `flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${adminTab === 'documents'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`, children: [_jsx(FileText, { className: "h-4 w-4" }), "\u30C9\u30AD\u30E5\u30E1\u30F3\u30C8\u30FB\u624B\u9806\u66F8"] })] }), _jsxs("div", { className: "animate-in fade-in duration-200", children: [adminTab === 'tickets' && (_jsx(TicketManagement, { initialTicketId: initialTicketId })), adminTab === 'conversations' && _jsx(ConversationLogs, {}), adminTab === 'knowledge' && _jsx(KnowledgeManagement, {}), adminTab === 'documents' && _jsx(DocumentManagement, {})] })] })) }), showManualModal && (_jsx(UserManualModal, { open: showManualModal, onClose: () => setShowManualModal(false) }))] }));
}
export default App;
