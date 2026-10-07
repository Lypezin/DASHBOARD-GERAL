import React from 'react';
import { Info, LucideIcon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/lib/utils';

interface StatisticCardProps {
    title: string;
    value: string | number;
    tooltipText: string;
    icon: LucideIcon;
    statusColor?: string;
    meta: string;
    sparklineData?: number[];
    sparklineColor?: string;
}

export const StatisticCard = React.memo(function StatisticCard({
    title,
    value,
    tooltipText,
    icon: Icon,
    statusColor = "text-slate-950 dark:text-slate-50",
    meta,
    sparklineData,
    sparklineColor
}: StatisticCardProps) {
    const valueString = String(value);

    return (
        <div className="group min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 dark:border-t-sky-700 dark:bg-slate-900 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#347ca3] dark:text-sky-200" aria-hidden="true" />
                <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">{title}</dt>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="button" aria-label={`Sobre ${title.toLowerCase()}`} className="shrink-0 rounded-sm text-slate-400 transition-colors hover:text-[#236b91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/30 dark:text-slate-500 dark:hover:text-sky-300">
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] border border-border text-xs">
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <dd className="mt-2 min-w-0">
                <span className={cn('block truncate text-[22px] font-semibold leading-7 tracking-tight tabular-nums', statusColor)} title={valueString}>
                    {value}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{meta}</span>
            </dd>

            {sparklineData && sparklineData.length >= 2 ? (
                <div className="mt-2 h-7 opacity-80 transition-opacity group-hover:opacity-100">
                    <Sparkline data={sparklineData} width={132} height={28} color={sparklineColor || '#347ca3'} strokeWidth={1.5} />
                </div>
            ) : null}
        </div>
    );
});

StatisticCard.displayName = 'StatisticCard';
