import React from 'react';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, UserCheck, Shield } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onRoleSwitch: (role: 'user' | 'admin') => void;
  onNewChat: () => void;
  onOpenManual: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleSwitch,
  onNewChat,
  onOpenManual,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                PRISM 一次受けAI
              </h1>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                AI Assistant
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              問い合わせ自動化 &amp; エスカレーションプラットフォーム
            </p>
          </div>
        </div>

        {/* Right Section: User Info, Manual, New Chat, Switch */}
        <div className="flex items-center gap-3">
          {/* User Info & Role Badge */}
          <div className="hidden md:flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5">
            <span className="text-xs font-medium text-foreground">{currentUser.name}</span>
            <Badge
              variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
              className="text-[11px] font-normal flex items-center gap-1"
            >
              {currentUser.role === 'admin' ? (
                <>
                  <Shield className="h-3 w-3" />
                  管理ユーザ
                </>
              ) : (
                <>
                  <UserCheck className="h-3 w-3" />
                  一般ユーザ
                </>
              )}
            </Badge>
          </div>

          {/* User Manual Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenManual}
            className="text-xs h-8"
          >
            📖 マニュアル
          </Button>

          {/* New Chat Button (Consistent Style) */}
          <Button
            size="sm"
            onClick={onNewChat}
            className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            新しい会話を開始
          </Button>

          {/* Role Switcher */}
          <div className="flex items-center rounded-lg border p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => onRoleSwitch('user')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentUser.role === 'user'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              一般
            </button>
            <button
              type="button"
              onClick={() => onRoleSwitch('admin')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentUser.role === 'admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              管理
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
