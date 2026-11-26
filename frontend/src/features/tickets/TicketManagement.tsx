import React, { useState, useEffect } from 'react';
import { Ticket } from '@/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TicketDetailModal } from './TicketDetailModal';
import { Filter, Eye, RefreshCw, AlertCircle } from 'lucide-react';

interface TicketManagementProps {
  initialTicketId?: string | null;
}

export const TicketManagement: React.FC<TicketManagementProps> = ({ initialTicketId }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId || null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTickets({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        urgency: filterUrgency !== 'all' ? filterUrgency : undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case '高':
        return <Badge variant="destructive">高</Badge>;
      case '中':
        return <Badge variant="warning">中</Badge>;
      default:
        return <Badge variant="secondary">低</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '新規':
        return <Badge className="bg-blue-600 text-white">新規</Badge>;
      case '対応中':
        return <Badge className="bg-amber-600 text-white">対応中</Badge>;
      case '完了':
        return <Badge className="bg-emerald-600 text-white">完了</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">絞り込み:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">ステータス: すべて</option>
            <option value="新規">新規</option>
            <option value="対応中">対応中</option>
            <option value="完了">完了</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">緊急度: すべて</option>
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          className="text-xs h-8 flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          再読み込み
        </Button>
      </div>

      {/* Ticket List Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">チケット一覧 ({tickets.length}件)</CardTitle>
            <span className="text-xs text-muted-foreground">Teams Webhook連携中</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-y bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">チケットID</th>
                  <th className="py-3 px-4">緊急度</th>
                  <th className="py-3 px-4">ステータス</th>
                  <th className="py-3 px-4">件名</th>
                  <th className="py-3 px-4">起票者</th>
                  <th className="py-3 px-4">カテゴリ</th>
                  <th className="py-3 px-4">起票日時</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      該当するチケットはありません
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedTicketId(t.id)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">{t.id}</td>
                      <td className="py-3 px-4">{getUrgencyBadge(t.urgency)}</td>
                      <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.user ? t.user.name : '-'}
                      </td>
                      <td className="py-3 px-4">{t.category}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicketId(t.id);
                          }}
                          className="h-7 text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          詳細
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

      {/* Ticket Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          open={Boolean(selectedTicketId)}
          onClose={() => setSelectedTicketId(null)}
          onUpdated={fetchTickets}
        />
      )}
    </div>
  );
};
