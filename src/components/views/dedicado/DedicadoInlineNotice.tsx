import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DedicadoInlineNoticeProps {
  message: string;
  tone?: 'warning' | 'info';
  onRetry?: () => void;
}

export function DedicadoInlineNotice({
  message,
  tone = 'warning',
  onRetry,
}: DedicadoInlineNoticeProps) {
  const isInfo = tone === 'info';
  const Icon = isInfo ? Info : AlertCircle;

  return (
    <div
      className={cn(
        'mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        isInfo
          ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200'
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{message}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="mt-1 text-xs font-bold underline underline-offset-2 hover:opacity-80">
            Tentar novamente
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default DedicadoInlineNotice;
