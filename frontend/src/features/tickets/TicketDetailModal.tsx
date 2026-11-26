import React, { useState, useEffect } from 'react';
import { Ticket, Conversation } from '@/types';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, CheckCircle, Clock, FileText, MessageSquare } from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  open,
  onClose,
  onUpdated,
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTicketDetail(ticketId);
        setTicket(data.ticket);
        setConversation(data.conversation || null);
      } catch (err) {
        console.error('Failed to fetch ticket detail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId && open) {
      fetchDetail();
    }
  }, [ticketId, open]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      const updated = await api.updateTicketStatus(ticket.id, newStatus);
      setTicket(updated);
      onUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!ticket && !isLoading) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={ticket ? `チケット詳細: ${ticket.id}` : 'チケット詳細'}
      maxWidth="max-w-3xl"
    >
      {isLoading || !ticket ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          チケット情報を読み込み中...
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {/* Header Info Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3.5 border">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-foreground">{ticket.subject}</span>
              <Badge variant={ticket.urgency === '高' ? 'destructive' : 'default'}>
                緊急度: {ticket.urgency}
              </Badge>
              <Badge variant="outline">カテゴリ: {ticket.category}</Badge>
            </div>

            {/* Status Change Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground mr-1">状態変更:</span>
              <Button
                size="sm"
                variant={ticket.status === '新規' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('新規')}
                className="h-7 text-xs px-2.5"
              >
                新規
              </Button>
              <Button
                size="sm"
                variant={ticket.status === '対応中' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('対応中')}
                className="h-7 text-xs px-2.5"
              >
                対応中
              </Button>
              <Button
                size="sm"
                variant={ticket.status === '完了' ? 'success' : 'outline'}
                onClick={() => handleStatusChange('完了')}
                className="h-7 text-xs px-2.5"
              >
                完了
              </Button>
            </div>
          </div>

          {/* User Details & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-3">
            <div>
              <span className="text-muted-foreground">起票者:</span>{' '}
              <span className="font-medium text-foreground">
                {ticket.user ? `${ticket.user.name} (${ticket.user.email})` : '未登録'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">起票日時:</span>{' '}
              <span className="font-medium text-foreground">
                {new Date(ticket.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>
            {ticket.phoneNumber && (
              <div className="sm:col-span-2 flex items-center gap-1.5 font-medium text-amber-800 bg-amber-50 p-2 rounded-md">
                <Phone className="h-4 w-4 text-amber-600" />
                <span>緊急連絡先電話番号: {ticket.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Ticket Detail (Summary) */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-600" />
              問い合わせ詳細 / やり取り要約
            </h4>
            <div className="rounded-lg border bg-card p-3.5 whitespace-pre-wrap leading-relaxed text-foreground">
              {ticket.detail}
            </div>
          </div>

          {/* Associated Conversation Log */}
          {conversation && (
            <div className="space-y-1.5 pt-2">
              <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                AI一次受けとの対話ログ ({conversation.messages.length}件)
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3">
                {conversation.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-blue-50 text-blue-950 border border-blue-100 ml-4'
                        : 'bg-card text-foreground border mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground pb-1">
                      <span className="font-semibold">
                        {m.sender === 'user' ? 'ユーザー' : 'PRISM AI'}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" size="sm" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
