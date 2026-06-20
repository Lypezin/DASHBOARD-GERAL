import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DedicadoInlineNoticeProps {
  message: string;
  tone?: 'warning' | 'info';
}

export function DedicadoInlineNotice({
  message,
  tone = 'warning',
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
      <p className="font-semibold">{message}</p>
    </div>
  );
}

export default DedicadoInlineNotice;
