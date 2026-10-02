import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';

const toneStyles: Record<Tone, {
  eyebrow: string;
  icon: string;
  metric: string;
}> = {
  blue: {
    eyebrow: 'border-border bg-accent text-primary',
    icon: 'bg-accent text-primary ring-border',
    metric: 'text-primary',
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
        'min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm motion-safe:animate-fade-in',
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
        'flex min-w-0 flex-col gap-4 border-b border-border bg-muted/35 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between',
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
  size = 'sm',
  className,
}: {
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ElementType;
  tone?: Tone;
  truncate?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const styles = toneStyles[tone];
  const title = typeof value === 'string' ? value : undefined;

  return (
    <div className={cn('min-w-0 rounded-lg border border-border bg-card px-3 py-2.5', className)}>
      <div className="mb-1 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {Icon && (
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ring-1', styles.icon)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          'min-w-0 font-mono font-semibold tabular-nums',
          size === 'lg' ? 'text-2xl tracking-tight' : 'text-sm',
          styles.metric,
          truncate && 'truncate'
        )}
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
        'subtle-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1',
        className
      )}
    >
      {children}
    </div>
  );
}
