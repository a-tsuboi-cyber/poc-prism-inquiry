import React, { useState, useEffect } from 'react';
import { User } from '@/types';
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
  const [currentUser, setCurrentUser] = useState<User>({
    name: '坪井 太郎',
    email: 'a-tsuboi@ntv.co.jp',
    role: 'user', // デフォルトは一般ユーザ
  });

  // チャットセッションID
  const [sessionId, setSessionId] = useState<string>(() => `SES-${Date.now()}`);

  // 管理画面のアクティブタブ
  const [adminTab, setAdminTab] = useState<'tickets' | 'conversations' | 'knowledge' | 'documents'>('tickets');

  // URLパラメータからのチケットID自動オープン（Teams連携リンク）
  const [initialTicketId, setInitialTicketId] = useState<string | null>(null);

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
  const handleRoleSwitch = (newRole: 'user' | 'admin') => {
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

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        onNewChat={handleNewChat}
        onOpenManual={() => setShowManualModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentUser.role === 'user' ? (
          // 一般ユーザー画面: チャットView
          <ChatView
            currentUser={currentUser}
            onNewChat={handleNewChat}
            sessionId={sessionId}
          />
        ) : (
          // 管理者画面: タブ切り替え管理ダッシュボード
          <div className="container mx-auto px-4 py-6 sm:px-6 max-w-7xl">
            {/* Admin Tabs */}
            <div className="mb-6 flex border-b border-border/80">
              <button
                onClick={() => setAdminTab('tickets')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  adminTab === 'tickets'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Ticket className="h-4 w-4" />
                チケット管理
              </button>

              <button
                onClick={() => setAdminTab('conversations')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  adminTab === 'conversations'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                やり取りログ履歴
              </button>

              <button
                onClick={() => setAdminTab('knowledge')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  adminTab === 'knowledge'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                ナレッジ管理
              </button>

              <button
                onClick={() => setAdminTab('documents')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  adminTab === 'documents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                ドキュメント・手順書
              </button>
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in duration-200">
              {adminTab === 'tickets' && (
                <TicketManagement initialTicketId={initialTicketId} />
              )}
              {adminTab === 'conversations' && <ConversationLogs />}
              {adminTab === 'knowledge' && <KnowledgeManagement />}
              {adminTab === 'documents' && <DocumentManagement />}
            </div>
          </div>
        )}
      </main>

      {/* Manual Modal */}
      {showManualModal && (
        <UserManualModal
          open={showManualModal}
          onClose={() => setShowManualModal(false)}
        />
      )}
    </div>
  );
}

export default App;
