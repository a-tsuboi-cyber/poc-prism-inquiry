import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionResultCardProps {
  type: 'resolved' | 'escalated';
  title: string;
  description: string;
  metaText?: string;
  onNewChat: () => void;
}

export const ActionResultCard: React.FC<ActionResultCardProps> = ({
  type,
  title,
  description,
  metaText,
  onNewChat,
}) => {
  const isResolved = type === 'resolved';

  return (
    <div
      className={cn(
        "my-4 rounded-xl border p-4 shadow-sm transition-all animate-in fade-in duration-300",
        isResolved
          ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
          : "border-red-200 bg-red-50/80 text-red-950"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm",
            isResolved
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {isResolved ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-sm leading-tight">{title}</h4>
          <p className="text-xs opacity-90 leading-relaxed">{description}</p>
          {metaText && (
            <p className="text-[11px] font-mono opacity-75 pt-0.5">{metaText}</p>
          )}
        </div>
      </div>

      {/* Action Footer: Unified Button Design for New Chat */}
      <div className="mt-3.5 flex justify-end border-t border-black/5 pt-3">
        <Button
          size="sm"
          onClick={onNewChat}
          className={cn(
            "text-xs h-8 text-white shadow-sm flex items-center gap-1.5",
            isResolved
              ? "bg-emerald-700 hover:bg-emerald-800"
              : "bg-red-700 hover:bg-red-800"
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          新しい会話を開始
        </Button>
      </div>
    </div>
  );
};
