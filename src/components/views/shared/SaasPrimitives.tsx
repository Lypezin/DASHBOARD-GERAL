import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';

const toneStyles: Record<Tone, {
  eyebrow: string;
  icon: string;
  metric: string;
}> = {
  blue: {
    eyebrow: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
    icon: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50',
    metric: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    eyebrow: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50',
    metric: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    eyebrow: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
    icon: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
    metric: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    eyebrow: 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300',
    icon: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/50',
    metric: 'text-rose-600 dark:text-rose-400',
  },
  slate: {
    eyebrow: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    icon: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800',
    metric: 'text-slate-950 dark:text-slate-50',
  },
};

export function SaasPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] animate-fade-in dark:border-slate-800/80 dark:bg-slate-950/80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SaasPanelHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  tone = 'blue',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-4 border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.90))] p-4 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.90))] sm:p-5 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className={cn('mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', styles.eyebrow)}>
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {eyebrow}
          </div>
        )}
        <h3 className="min-w-0 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="min-w-0 shrink-0">{actions}</div>}
    </div>
  );
}

export function SaasMetric({
  label,
  value,
  meta,
  icon: Icon,
  tone = 'slate',
  truncate = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ElementType;
  tone?: Tone;
  truncate?: boolean;
  className?: string;
}) {
  const styles = toneStyles[tone];
  const title = typeof value === 'string' ? value : undefined;

  return (
    <div className={cn('min-w-0 rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/50', className)}>
      <div className="mb-1 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {Icon && (
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ring-1', styles.icon)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn('min-w-0 font-mono text-sm font-semibold tabular-nums', styles.metric, truncate && 'truncate')}
        title={title}
      >
        {value}
      </div>
      {meta && <div className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{meta}</div>}
    </div>
  );
}

export function SaasSegmentedControl({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'subtle-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1 shadow-inner backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70',
        className
      )}
    >
      {children}
    </div>
  );
}

