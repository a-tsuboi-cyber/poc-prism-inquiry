import React, { useState, useEffect } from 'react';
import { Conversation } from '@/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { MessageSquare, RefreshCw, Eye, Sparkles } from 'lucide-react';

export const ConversationLogs: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">やり取りログ履歴</h3>
          <p className="text-xs text-muted-foreground">
            ユーザーとAIの全チャットセッションおよび自己解決・エスカレーションの状況
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchConversations}
          className="text-xs h-8 flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          再読み込み
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">全セッション一覧 ({conversations.length}件)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">セッションID</th>
                  <th className="py-3 px-4">ステータス</th>
                  <th className="py-3 px-4">ユーザー</th>
                  <th className="py-3 px-4">問い合わせトピック</th>
                  <th className="py-3 px-4">発話数</th>
                  <th className="py-3 px-4">ナレッジ候補</th>
                  <th className="py-3 px-4">開始日時</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      対話ログはありません
                    </td>
                  </tr>
                ) : (
                  conversations.map((c) => (
                    <tr
                      key={c.sessionId}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedConv(c)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {c.sessionId}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            c.status === 'クローズ（自己解決）'
                              ? 'success'
                              : c.status === 'エスカレーション'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {c.user ? c.user.name : '-'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                        {c.topic || '-'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.messages.length}件
                      </td>
                      <td className="py-3 px-4">
                        {c.isKnowledgeCandidate ? (
                          <Badge variant="warning" className="text-[10px]">
                            <Sparkles className="h-3 w-3 mr-1" />
                            候補
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(c.startedAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConv(c);
                          }}
                          className="h-7 text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ログ
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedConv && (
        <Dialog
          open={Boolean(selectedConv)}
          onClose={() => setSelectedConv(null)}
          title={`対話ログ詳細: ${selectedConv.sessionId}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between rounded-lg bg-muted/40 p-3 border">
              <div>
                ユーザー: <span className="font-semibold text-foreground">{selectedConv.user.name}</span>
              </div>
              <Badge variant="outline">{selectedConv.status}</Badge>
            </div>

            {/* Message history */}
            <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3">
              {selectedConv.messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-50 text-blue-950 border border-blue-100 ml-6'
                      : 'bg-card text-foreground border mr-6'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pb-1">
                    <span className="font-semibold">
                      {m.sender === 'user' ? 'ユーザー' : 'PRISM AI'}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setSelectedConv(null)}>
                閉じる
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
