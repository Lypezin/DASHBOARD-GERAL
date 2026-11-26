'use client';

import { motion, type Variants } from 'framer-motion';
import { AnimatedNumberText } from '@/components/ui/animated-counter';
import type { EntregadoresMetricItem } from '../utils/entregadoresMetrics';

const toneStyles: Record<EntregadoresMetricItem['tone'], string> = {
    blue: 'text-[#347ca3] dark:text-sky-200',
    emerald: 'text-[#2678a0] dark:text-sky-200',
    rose: 'text-[#936653] dark:text-rose-200',
    amber: 'text-[#806b48] dark:text-amber-200',
};

const metricVariants: Variants = {
    hidden: { opacity: 0, y: 7 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

export function EntregadoresOverviewMetric({
    icon: Icon,
    label,
    value,
    meta,
    tone,
    reduceMotion,
}: EntregadoresMetricItem & { reduceMotion: boolean }) {
    return (
        <motion.div
            variants={reduceMotion ? undefined : metricVariants}
            className="min-w-0 rounded-xl border border-[#d8e4eb] border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:border-t-sky-700 dark:bg-slate-900 xl:px-5"
        >
            <div className="flex min-w-0 items-center gap-2">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${toneStyles[tone]}`} aria-hidden="true" />
                <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">
                    {label}
                </dt>
            </div>

            <dd className="mt-2 min-h-7 font-sans text-[23px] font-semibold tracking-tight text-[#173f5a] tabular-nums dark:text-slate-50">
                <span className="block">
                    <AnimatedNumberText value={value} />
                </span>
                <span className="sr-only">{meta}</span>
            </dd>
        </motion.div>
    );
}
