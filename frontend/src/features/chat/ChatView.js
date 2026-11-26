import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ActionResultCard } from './ActionResultCard';
import { EscalateModal } from '@/features/tickets/EscalateModal';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Send, CheckCircle, AlertTriangle, Bot, User as UserIcon } from 'lucide-react';
import { marked } from 'marked';
export const ChatView = ({ currentUser, onNewChat, sessionId, }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('AIが回答を生成中...');
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
    // ステータス制御
    const [isResolved, setIsResolved] = useState(false);
    const [escalatedTicketId, setEscalatedTicketId] = useState(null);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalateSummary, setEscalateSummary] = useState(null);
    // ストリーミング表示用状態
    const [streamingMessageIndex, setStreamingMessageIndex] = useState(null);
    const [displayedText, setDisplayedText] = useState('');
    const messagesEndRef = useRef(null);
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
    const handleSendMessage = async (e) => {
        if (e)
            e.preventDefault();
        if (!inputText.trim() || isLoading)
            return;
        const userMsg = inputText.trim();
        setInputText('');
        const newMessages = [
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
                }
                else {
                    setDisplayedText(fullText.slice(0, currentLength));
                }
            }, speed);
        }
        catch (err) {
            console.error('Failed to send message:', err);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'ai',
                    text: 'エラーが発生しました。ネットワーク接続を確認の上、もう一度お試しください。',
                    timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        }
        finally {
            setIsLoading(false);
        }
    };
    // 「解決した」クリック
    const handleResolve = async () => {
        if (isResolved || escalatedTicketId)
            return;
        setIsResolved(true);
        await api.updateChatStatus(sessionId, 'クローズ（自己解決）');
    };
    // 「解決しない（エスカレーション）」クリック
    const handleStartEscalation = async () => {
        if (escalatedTicketId)
            return;
        setLoadingMessage('問い合わせ内容を分析・要約中...');
        setShowLoadingOverlay(true);
        try {
            const summary = await api.getChatSummary(sessionId);
            setEscalateSummary(summary);
            setShowEscalateModal(true);
        }
        catch (err) {
            console.error('Failed to get summary:', err);
            // フォールバック
            setEscalateSummary({
                subject: 'PRISM問い合わせ',
                detail: messages.filter((m) => m.sender === 'user').map((m) => m.text).join('\n'),
                category: '一般',
                urgency: '中',
            });
            setShowEscalateModal(true);
        }
        finally {
            setShowLoadingOverlay(false);
        }
    };
    // エスカレーション送信成功コールバック
    const handleEscalated = (ticketId) => {
        setEscalatedTicketId(ticketId);
        setShowEscalateModal(false);
    };
    return (_jsxs("div", { className: "flex h-[calc(100vh-4rem)] flex-col bg-background", children: [_jsx(LoadingOverlay, { show: showLoadingOverlay, message: loadingMessage }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-6 sm:px-6", children: _jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [messages.map((msg, index) => {
                            const isUser = msg.sender === 'user';
                            const isStreaming = streamingMessageIndex === index;
                            const textToRender = isStreaming ? displayedText : msg.text;
                            return (_jsxs("div", { className: `flex gap-3.5 animate-in fade-in duration-200 ${isUser ? 'justify-end' : 'justify-start'}`, children: [!isUser && (_jsx("div", { className: "flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm", children: _jsx(Bot, { className: "h-5 w-5" }) })), _jsxs("div", { className: `relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all sm:max-w-[75%] ${isUser
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-card text-foreground border rounded-bl-none'}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2 pb-1 text-[11px] opacity-75", children: [_jsx("span", { className: "font-semibold", children: isUser ? currentUser.name : 'PRISM 一次受けAI' }), _jsx("span", { children: msg.timestamp })] }), isUser ? (_jsx("div", { className: "whitespace-pre-wrap leading-relaxed", children: msg.text })) : (_jsx("div", { className: "prose-chat leading-relaxed", dangerouslySetInnerHTML: {
                                                    __html: marked.parse(textToRender || ''),
                                                } }))] }), isUser && (_jsx("div", { className: "flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-muted text-muted-foreground border shadow-sm", children: _jsx(UserIcon, { className: "h-5 w-5" }) }))] }, index));
                        }), isLoading && streamingMessageIndex === null && (_jsxs("div", { className: "flex gap-3.5 animate-in fade-in duration-200 justify-start", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm", children: _jsx(Bot, { className: "h-5 w-5 animate-pulse" }) }), _jsxs("div", { className: "rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm flex items-center gap-2", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-blue-600 animate-ping" }), _jsx("span", { children: "AI\u304C\u56DE\u7B54\u3092\u751F\u6210\u4E2D..." })] })] })), isResolved && (_jsx(ActionResultCard, { type: "resolved", title: "\u304A\u554F\u3044\u5408\u308F\u305B\u304C\u89E3\u6C7A\u3057\u307E\u3057\u305F", description: "\u81EA\u5DF1\u89E3\u6C7A\u3078\u306E\u3054\u5354\u529B\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\u3002\u4ED6\u306B\u4E0D\u660E\u70B9\u304C\u3054\u3056\u3044\u307E\u3057\u305F\u3089\u3001\u3044\u3064\u3067\u3082\u65B0\u3057\u3044\u4F1A\u8A71\u3092\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044\u3002", metaText: "\u30B9\u30C6\u30FC\u30BF\u30B9: \u89E3\u6C7A\u6E08\u307F", onNewChat: onNewChat })), escalatedTicketId && (_jsx(ActionResultCard, { type: "escalated", title: "\u30B5\u30DD\u30FC\u30C8\u7A93\u53E3\uFF08\u62C5\u5F53\u8005\uFF09\u3078\u30A8\u30B9\u30AB\u30EC\u30FC\u30B7\u30E7\u30F3\u3057\u307E\u3057\u305F", description: "\u554F\u3044\u5408\u308F\u305B\u30C1\u30B1\u30C3\u30C8\u3092\u4F5C\u6210\u3057\u3001\u62C5\u5F53\u90E8\u7F72\u304A\u3088\u3073Microsoft Teams\u3078\u901A\u77E5\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002\u8FFD\u3063\u3066\u62C5\u5F53\u8005\u3088\u308A\u3054\u9023\u7D61\u3044\u305F\u3057\u307E\u3059\u3002", metaText: `チケット番号: ${escalatedTicketId}`, onNewChat: onNewChat })), _jsx("div", { ref: messagesEndRef })] }) }), _jsx("div", { className: "border-t bg-card/80 p-4 backdrop-blur", children: _jsxs("div", { className: "mx-auto max-w-3xl space-y-3", children: [_jsxs("form", { onSubmit: handleSendMessage, className: "flex gap-2", children: [_jsx(Textarea, { value: inputText, onChange: (e) => setInputText(e.target.value), onKeyDown: (e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }, placeholder: "\u8CEA\u554F\u3084\u30B7\u30B9\u30C6\u30E0\u306E\u304A\u56F0\u308A\u3054\u3068\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044 (Enter\u3067\u9001\u4FE1, Shift+Enter\u3067\u6539\u884C)", className: "min-h-[48px] max-h-32 resize-none rounded-xl", disabled: isLoading || isResolved || Boolean(escalatedTicketId) }), _jsxs(Button, { type: "submit", disabled: !inputText.trim() || isLoading || isResolved || Boolean(escalatedTicketId), className: "h-[48px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2", children: [_jsx(Send, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "\u9001\u4FE1" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs", children: [_jsx("div", { className: "text-muted-foreground flex items-center gap-1.5", children: _jsx("span", { children: "\u3053\u306E\u56DE\u7B54\u3067\u89E3\u6C7A\u3057\u307E\u3057\u305F\u304B\uFF1F" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: handleResolve, disabled: isResolved || Boolean(escalatedTicketId) || messages.length <= 1, className: "h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-1", children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5" }), "\u89E3\u6C7A\u3057\u305F"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleStartEscalation, disabled: isResolved || Boolean(escalatedTicketId) || messages.length <= 1, className: "h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-1", children: [_jsx(AlertTriangle, { className: "h-3.5 w-3.5" }), "\u89E3\u6C7A\u3057\u306A\u3044\uFF08\u62C5\u5F53\u8005\u3078\u30A8\u30B9\u30AB\u30EC\uFF09"] })] })] })] }) }), showEscalateModal && (_jsx(EscalateModal, { open: showEscalateModal, onClose: () => setShowEscalateModal(false), sessionId: sessionId, currentUser: currentUser, initialSummary: escalateSummary, onSuccess: handleEscalated }))] }));
};
