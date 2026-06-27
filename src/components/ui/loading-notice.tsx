import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingNoticeTone = 'blue' | 'emerald' | 'sky';

interface LoadingNoticeProps {
  message: string;
  detail?: string;
  tone?: LoadingNoticeTone;
  className?: string;
}

const toneStyles: Record<LoadingNoticeTone, { shell: string; icon: string; bar: string }> = {
  blue: {
    shell: 'border-blue-200/70 bg-blue-50/85 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-100',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/45 dark:text-blue-200',
    bar: 'from-blue-500/0 via-blue-500/75 to-blue-500/0',
  },
  emerald: {
    shell: 'border-emerald-200/70 bg-emerald-50/85 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-200',
    bar: 'from-emerald-500/0 via-emerald-500/75 to-emerald-500/0',
  },
  sky: {
    shell: 'border-sky-200/70 bg-sky-50/85 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-100',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/45 dark:text-sky-200',
    bar: 'from-sky-500/0 via-sky-500/75 to-sky-500/0',
  },
};

export function LoadingNotice({
  message,
  detail,
  tone = 'blue',
  className,
}: LoadingNoticeProps) {
  const styles = toneStyles[tone];

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border px-4 py-3 shadow-sm', styles.shell, className)}>
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl', styles.icon)}>
          <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight">{message}</p>
          {detail ? <p className="mt-1 text-xs font-medium opacity-80">{detail}</p> : null}
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
        <div className={cn('h-full w-1/2 rounded-full bg-gradient-to-r motion-safe:animate-pulse', styles.bar)} />
      </div>
    </div>
  );
}
