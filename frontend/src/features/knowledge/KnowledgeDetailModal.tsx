import React, { useState, useEffect } from 'react';
import { Knowledge } from '@/types';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Save, Trash2 } from 'lucide-react';

interface KnowledgeDetailModalProps {
  open: boolean;
  knowledge: Knowledge | null;
  isNew?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const KnowledgeDetailModal: React.FC<KnowledgeDetailModalProps> = ({
  open,
  knowledge,
  isNew = false,
  onClose,
  onSaved,
}) => {
  const [category, setCategory] = useState(knowledge?.category || '一般');
  const [question, setQuestion] = useState(knowledge?.question || '');
  const [answer, setAnswer] = useState(knowledge?.answer || '');
  const [tags, setTags] = useState(knowledge?.tags?.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (knowledge) {
      setCategory(knowledge.category);
      setQuestion(knowledge.question);
      setAnswer(knowledge.answer);
      setTags(knowledge.tags?.join(', ') || '');
    } else {
      setCategory('一般');
      setQuestion('');
      setAnswer('');
      setTags('');
    }
  }, [knowledge, isNew]);

  const handleDelete = async () => {
    if (!knowledge) return;
    if (!confirm(`ナレッジ「${knowledge.id}」を削除してもよろしいですか？`)) return;

    setIsDeleting(true);
    try {
      await api.deleteKnowledge(knowledge.id);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to delete knowledge:', err);
      alert('ナレッジの削除に失敗しました。');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();
    if (!trimmedQuestion || !trimmedAnswer) return;

    setIsSaving(true);
    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (isNew) {
        await api.createKnowledge({
          category,
          question: trimmedQuestion,
          answer: trimmedAnswer,
          tags: tagArray,
        });
      } else if (knowledge) {
        await api.updateKnowledge(knowledge.id, {
          category,
          question: trimmedQuestion,
          answer: trimmedAnswer,
          tags: tagArray,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save knowledge:', err);
      alert('ナレッジの保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isNew ? 'ナレッジ新規登録' : `ナレッジ編集: ${knowledge?.id}`}
      description="登録・更新時にGemini AIが内容を分析し、自己解決率を高める改善ヒントを自動生成します。"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Category & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="一般">一般</option>
              <option value="システム不具合">システム不具合</option>
              <option value="アカウント・権限">アカウント・権限</option>
              <option value="操作方法">操作方法</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">検索タグ (カンマ区切り)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例: パスワード, ロック, 申請"
            />
          </div>
        </div>

        {/* Question */}
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground">
            質問 / 問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="ユーザーからの想定される問い合わせ内容"
            required
          />
        </div>

        {/* Answer */}
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground">
            回答内容 / 解決手順 <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            placeholder="自己解決のための案内手順やリンクなど"
            required
          />
        </div>

        {/* AI Hints Display (If editing existing) */}
        {!isNew && knowledge?.aiHints && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900 pb-1">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>AI品質改善ヒント</span>
            </div>
            <p className="text-blue-950 leading-relaxed">{knowledge.aiHints}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            {!isNew && knowledge && (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || isDeleting}
                onClick={handleDelete}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? '削除中...' : '削除'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSaving || isDeleting} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
