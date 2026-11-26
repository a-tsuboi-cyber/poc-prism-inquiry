import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Phone, AlertCircle, Sparkles } from 'lucide-react';

interface EscalateModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  currentUser: User;
  initialSummary?: {
    subject?: string;
    detail?: string;
    category?: string;
    urgency?: string;
    linkedKnowledgeId?: string | null;
  };
  onSuccess: (ticketId: string) => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  open,
  onClose,
  sessionId,
  currentUser,
  initialSummary,
  onSuccess,
}) => {
  const [subject, setSubject] = useState(initialSummary?.subject || '');
  const [category, setCategory] = useState(initialSummary?.category || '一般');
  const [urgency, setUrgency] = useState<'高' | '中' | '低'>(
    (initialSummary?.urgency as '高' | '中' | '低') || '中'
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [detail, setDetail] = useState(initialSummary?.detail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSummary) {
      if (initialSummary.subject) setSubject(initialSummary.subject);
      if (initialSummary.category) setCategory(initialSummary.category);
      if (initialSummary.urgency) setUrgency(initialSummary.urgency as any);
      if (initialSummary.detail) setDetail(initialSummary.detail);
    }
  }, [initialSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('件名を入力してください');
      return;
    }
    if (!category.trim()) {
      setError('カテゴリを選択してください（必須）');
      return;
    }
    if (!detail.trim()) {
      setError('問い合わせ詳細を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ticket = await api.createTicket({
        sessionId,
        subject: subject.trim(),
        category,
        urgency,
        phoneNumber: urgency === '高' ? phoneNumber.trim() : undefined,
        detail: detail.trim(),
        linkedKnowledgeId: initialSummary?.linkedKnowledgeId,
        user: { name: currentUser.name, email: currentUser.email },
      });

      onSuccess(ticket.id);
    } catch (err: any) {
      console.error('Failed to escalate ticket:', err);
      setError(err.message || 'チケットの起票に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="サポート担当者へエスカレーション"
      description="これまでの会話内容を元に問い合わせ要約を生成しました。必要に応じて修正し、送信してください。"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 起票者情報 */}
        <div className="rounded-lg bg-muted/40 p-3 text-xs flex justify-between items-center text-muted-foreground border">
          <div>起票者: <span className="font-semibold text-foreground">{currentUser.name}</span> ({currentUser.email})</div>
          <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
            <Sparkles className="h-3 w-3" />
            AI自動要約連携
          </span>
        </div>

        {/* 件名 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            件名 <span className="text-red-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="例: 【問い合わせ】504エラーで画面が表示されない"
            required
          />
        </div>

        {/* カテゴリ & 緊急度 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              カテゴリ <span className="text-red-500">* (必須)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="一般">一般</option>
              <option value="システム不具合">システム不具合</option>
              <option value="アカウント・権限">アカウント・権限</option>
              <option value="操作方法">操作方法</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              緊急度
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="低">低 (数営業日以内で可)</option>
              <option value="中">中 (当日中)</option>
              <option value="高">高 (緊急・業務停止リスク)</option>
            </select>
          </div>
        </div>

        {/* 電話番号（緊急度フラグ高の時のみ表示・入力可能） */}
        {urgency === '高' && (
          <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-amber-600" />
                緊急連絡先電話番号 (任意)
              </label>
              <span className="text-[10px] text-amber-700">緊急度「高」専用</span>
            </div>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="例: 090-1234-5678 (至急連絡が必要な場合にご記入ください)"
              className="bg-white"
            />
            <p className="text-[11px] text-amber-800">
              ※ 緊急度「高」が選択されているため、担当者より至急お電話を差し上げる場合があります。
            </p>
          </div>
        )}

        {/* 問い合わせ詳細（ユーザーになりきった一人称サマリー） */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              問い合わせ詳細 <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              ※AIがユーザー視点で要約済み
            </span>
          </div>
          <Textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={5}
            className="text-xs leading-relaxed"
            placeholder="困っている内容、発生しているエラー、試した手順などを詳しくご記入ください。"
            required
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? '送信中...' : 'チケット起票 & Teams通知'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
