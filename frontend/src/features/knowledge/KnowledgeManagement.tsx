import React, { useState, useEffect } from 'react';
import { Knowledge } from '@/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KnowledgeDetailModal } from './KnowledgeDetailModal';
import { Plus, Search, Edit2, Sparkles, BookOpen } from 'lucide-react';

export const KnowledgeManagement: React.FC = () => {
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchKnowledge = async (q?: string) => {
    setIsLoading(true);
    try {
      const data = await api.getKnowledge(q);
      setKnowledgeList(data);
    } catch (err) {
      console.error('Failed to fetch knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Search & Add Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ナレッジをキーワードで検索..."
            className="h-8 text-xs"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1">
            <Search className="h-3.5 w-3.5" />
            検索
          </Button>
        </form>

        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          ナレッジ新規登録
        </Button>
      </div>

      {/* Knowledge Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">登録ナレッジ一覧 ({knowledgeList.length}件)</CardTitle>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Gemini AI改善ヒント連携対応
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">カテゴリ</th>
                  <th className="py-3 px-4">質問 / 問い合わせ内容</th>
                  <th className="py-3 px-4">タグ</th>
                  <th className="py-3 px-4">参照回数</th>
                  <th className="py-3 px-4">AIヒント</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {knowledgeList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      登録されているナレッジはありません
                    </td>
                  </tr>
                ) : (
                  knowledgeList.map((k) => (
                    <tr
                      key={k.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setEditingKnowledge(k)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">{k.id}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{k.category}</Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-sm truncate">
                        {k.question}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {k.tags?.map((t, idx) => (
                            <span key={idx} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {k.usageCount || 0}回
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                        {k.aiHints ? (
                          <span className="text-blue-600 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 shrink-0" />
                            {k.aiHints.slice(0, 30)}...
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingKnowledge(k);
                          }}
                          className="h-7 text-xs flex items-center gap-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          編集
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

      {/* Knowledge Create or Edit Modal */}
      {(editingKnowledge || isCreating) && (
        <KnowledgeDetailModal
          open={Boolean(editingKnowledge || isCreating)}
          knowledge={editingKnowledge}
          isNew={isCreating}
          onClose={() => {
            setEditingKnowledge(null);
            setIsCreating(false);
          }}
          onSaved={() => {
            setEditingKnowledge(null);
            setIsCreating(false);
            fetchKnowledge();
          }}
        />
      )}
    </div>
  );
};
