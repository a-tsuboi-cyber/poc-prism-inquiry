import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = "処理中...",
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-2xl border text-center max-w-xs mx-4 animate-in zoom-in-95 duration-200">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <span className="text-xs text-muted-foreground">しばらくお待ちください</span>
      </div>
    </div>
  );
};
