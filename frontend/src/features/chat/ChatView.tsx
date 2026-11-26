import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ActionResultCard } from './ActionResultCard';
import { EscalateModal } from '@/features/tickets/EscalateModal';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Send, CheckCircle, AlertTriangle, Bot, User as UserIcon } from 'lucide-react';
import { marked } from 'marked';

interface ChatViewProps {
  currentUser: User;
  onNewChat: () => void;
  sessionId: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  onNewChat,
  sessionId,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AIが回答を生成中...');
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // ステータス制御
  const [isResolved, setIsResolved] = useState(false);
  const [escalatedTicketId, setEscalatedTicketId] = useState<string | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateSummary, setEscalateSummary] = useState<any>(null);

  // ストリーミング表示用状態
  const [streamingMessageIndex, setStreamingMessageIndex] = useState<number | null>(null);
  const [displayedText, setDisplayedText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedText]);

  // 新規セッション開始時の初期メッセージ
  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text: `こんにちは！PRISM 一次受けAIアシスタントです。\nシステムの操作方法、障害・エラー、申請手続きなど、ご不明な点があればお気軽にお尋ねください。`,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsResolved(false);
    setEscalatedTicketId(null);
  }, [sessionId]);

  // メッセージ送信
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        sender: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await api.sendMessage({
        sessionId,
        user: { name: currentUser.name, email: currentUser.email },
        message: userMsg,
      });

      // AI回答をストリーミング表示
      const fullText = res.aiMessage;
      const targetIndex = newMessages.length;
      setStreamingMessageIndex(targetIndex);
      setDisplayedText('');

      // メッセージ配列に空文字でAIメッセージを先行追加
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: fullText,
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // タイピング風ストリーミングアニメーション
      let currentLength = 0;
      const speed = 15; // ms per chunk
      const timer = setInterval(() => {
        currentLength += 2;
        if (currentLength >= fullText.length) {
          clearInterval(timer);
          setStreamingMessageIndex(null);
          setDisplayedText('');
        } else {
          setDisplayedText(fullText.slice(0, currentLength));
        }
      }, speed);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'エラーが発生しました。ネットワーク接続を確認の上、もう一度お試しください。',
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 「解決した」クリック
  const handleResolve = async () => {
    if (isResolved || escalatedTicketId) return;
    setIsResolved(true);
    await api.updateChatStatus(sessionId, 'クローズ（自己解決）');
  };

  // 「解決しない（エスカレーション）」クリック
  const handleStartEscalation = async () => {
    if (escalatedTicketId) return;
    setLoadingMessage('問い合わせ内容を分析・要約中...');
    setShowLoadingOverlay(true);

    try {
      const summary = await api.getChatSummary(sessionId);
      setEscalateSummary(summary);
      setShowEscalateModal(true);
    } catch (err) {
      console.error('Failed to get summary:', err);
      // フォールバック
      setEscalateSummary({
        subject: 'PRISM問い合わせ',
        detail: messages.filter((m) => m.sender === 'user').map((m) => m.text).join('\n'),
        category: '一般',
        urgency: '中',
      });
      setShowEscalateModal(true);
    } finally {
      setShowLoadingOverlay(false);
    }
  };

  // エスカレーション送信成功コールバック
  const handleEscalated = (ticketId: string) => {
    setEscalatedTicketId(ticketId);
    setShowEscalateModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Loading Overlay */}
      <LoadingOverlay show={showLoadingOverlay} message={loadingMessage} />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isStreaming = streamingMessageIndex === index;
            const textToRender = isStreaming ? displayedText : msg.text;

            return (
              <div
                key={index}
                className={`flex gap-3.5 animate-in fade-in duration-200 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all sm:max-w-[75%] ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-card text-foreground border rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1 text-[11px] opacity-75">
                    <span className="font-semibold">
                      {isUser ? currentUser.name : 'PRISM 一次受けAI'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  ) : (
                    <div
                      className="prose-chat leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(textToRender || ''),
                      }}
                    />
                  )}
                </div>

                {isUser && (
                  <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-muted text-muted-foreground border shadow-sm">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* AI考え中インジケータ */}
          {isLoading && streamingMessageIndex === null && (
            <div className="flex gap-3.5 animate-in fade-in duration-200 justify-start">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Bot className="h-5 w-5 animate-pulse" />
              </div>
              <div className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                <span>AIが回答を生成中...</span>
              </div>
            </div>
          )}

          {/* 解決した座布団カード */}
          {isResolved && (
            <ActionResultCard
              type="resolved"
              title="お問い合わせが解決しました"
              description="自己解決へのご協力ありがとうございます。他に不明点がございましたら、いつでも新しい会話を開始してください。"
              metaText="ステータス: 解決済み"
              onNewChat={onNewChat}
            />
          )}

          {/* エスカレーション完了後の赤い座布団カード */}
          {escalatedTicketId && (
            <ActionResultCard
              type="escalated"
              title="サポート窓口（担当者）へエスカレーションしました"
              description="問い合わせチケットを作成し、担当部署およびMicrosoft Teamsへ通知を送信しました。追って担当者よりご連絡いたします。"
              metaText={`チケット番号: ${escalatedTicketId}`}
              onNewChat={onNewChat}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input & Feedback Action Bar */}
      <div className="border-t bg-card/80 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Main Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="質問やシステムのお困りごとを入力してください (Enterで送信, Shift+Enterで改行)"
              className="min-h-[48px] max-h-32 resize-none rounded-xl"
              disabled={isLoading || isResolved || Boolean(escalatedTicketId)}
            />
            <Button
              type="submit"
              disabled={!inputText.trim() || isLoading || isResolved || Boolean(escalatedTicketId)}
              className="h-[48px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">送信</span>
            </Button>
          </form>

          {/* Resolution & Escalation Buttons (Below Input Area) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
            <div className="text-muted-foreground flex items-center gap-1.5">
              <span>この回答で解決しましたか？</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResolve}
                disabled={isResolved || Boolean(escalatedTicketId) || messages.length <= 1}
                className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                解決した
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEscalation}
                disabled={isResolved || Boolean(escalatedTicketId) || messages.length <= 1}
                className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-1"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                解決しない（担当者へエスカレ）
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscalateModal && (
        <EscalateModal
          open={showEscalateModal}
          onClose={() => setShowEscalateModal(false)}
          sessionId={sessionId}
          currentUser={currentUser}
          initialSummary={escalateSummary}
          onSuccess={handleEscalated}
        />
      )}
    </div>
  );
};
