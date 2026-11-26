import React, { useState, useEffect } from 'react';
import { DocumentItem } from '@/types';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, BookOpen } from 'lucide-react';

interface UserManualModalProps {
  open: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ open, onClose }) => {
  const [manuals, setManuals] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      api
        .getDocuments({ type: 'manual' })
        .then((docs) => setManuals(docs))
        .catch((err) => console.error('Failed to fetch manuals:', err))
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="PRISM システムマニュアル・手順書一覧"
      description="登録されている最新の利用者向けマニュアルや操作手順書をダウンロードしてご確認いただけます。"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
        ) : manuals.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            現在公開されているマニュアルはありません。
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border bg-card">
            {manuals.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3.5 hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{m.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ファイル名: {m.originalFileName} ({Math.round(m.fileSize / 1024)} KB)
                    </p>
                  </div>
                </div>

                <a
                  href={api.getDocumentDownloadUrl(m.id)}
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  ダウンロード
                </a>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
