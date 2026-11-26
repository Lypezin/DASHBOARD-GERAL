import React from 'react';
import { AlertCircle } from 'lucide-react';
import { LoadingNotice } from '@/components/ui/loading-notice';

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
  if (tone === 'info' && !onRetry) {
    return (
      <LoadingNotice
        tone="blue"
        message={message}
        className="mb-4"
      />
    );
  }

  return (
    <div
      role={tone === 'warning' ? 'alert' : 'status'}
      className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
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
