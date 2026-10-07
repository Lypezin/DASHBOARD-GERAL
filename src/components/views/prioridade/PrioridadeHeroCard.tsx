import React from 'react';
import type { LucideIcon } from 'lucide-react';

type Tone = 'blue' | 'sky' | 'emerald' | 'rose';

const tones: Record<Tone, { icon: string; progress: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', progress: 'bg-blue-600' },
  sky: { icon: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', progress: 'bg-sky-600' },
  emerald: { icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', progress: 'bg-emerald-600' },
  rose: { icon: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', progress: 'bg-rose-600' },
};

export const PrioridadeHeroCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  tone,
  isPercentage = false,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  tone: Tone;
  isPercentage?: boolean;
}) => (
  <div className="min-w-0 bg-white px-3 py-3.5 transition-colors duration-150 hover:bg-[#f8fbfc] dark:bg-slate-950/70 dark:hover:bg-slate-900 sm:px-3.5">
    <div className="flex min-w-0 items-center gap-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tones[tone].icon}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <dt className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{title}</dt>
    </div>
    <dd className="mt-2 whitespace-nowrap font-mono text-xl font-semibold tracking-tight text-[#183f58] tabular-nums dark:text-slate-50" title={value}>
      {value}
    </dd>
    <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{subtext}</p>
    {isPercentage ? (
      <div
        className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-label={`${title}: ${value}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.max(0, Math.min(Number.parseFloat(value), 100))}
      >
        <div className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${tones[tone].progress}`} style={{ width: `${Math.max(0, Math.min(Number.parseFloat(value), 100))}%` }} />
      </div>
    ) : null}
  </div>
);
