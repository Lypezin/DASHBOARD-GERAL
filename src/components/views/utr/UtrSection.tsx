import React from 'react';
import { formatCompactTime, formatarHorasParaHMS } from '@/utils/formatters';

interface UtrItemBase {
    tempo_horas: number;
    corridas: number;
    utr: number;
    [key: string]: any;
}

interface UtrSectionProps<T extends UtrItemBase> {
    title: string;
    description: string;
    icon: React.ReactNode;
    data: T[];
    getLabel: (item: T) => string;
}

export const UtrSection = React.memo(function UtrSection<T extends UtrItemBase>({
    title,
    description,
    icon,
    data,
    getLabel
}: UtrSectionProps<T>) {
    if (!data || data.length === 0) return null;

    return (
        <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex shrink-0 items-center gap-3 border-b border-[#e2ebf0] px-4 py-3.5 dark:border-slate-800 sm:px-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#edf5f9] dark:bg-slate-800">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#183f58] dark:text-slate-100">{title}</h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            <div className="flex-1 divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {data.map((item, index) => {
                    const label = getLabel(item);
                    const fullTime = formatarHorasParaHMS(item.tempo_horas ?? 0);
                    const compactTime = formatCompactTime(fullTime);
                    const formattedCorridas = (item.corridas ?? 0).toLocaleString('pt-BR');

                    return (
                        <div
                            key={`${label}-${index}`}
                            className="group flex min-w-0 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[#f5f9fb] dark:hover:bg-slate-800/50 sm:px-5"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-[#236b91] dark:text-slate-100 dark:group-hover:text-sky-300" title={label || 'N/D'}>
                                    {label || 'N/D'}
                                </p>
                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Metric label="Tempo" value={compactTime} title={fullTime} />
                                    <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <Metric label="Corridas" value={formattedCorridas} title={formattedCorridas} />
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">UTR</span>
                                <div className="rounded-md bg-[#edf5f9] px-2.5 py-1 dark:bg-slate-800">
                                    <span className="font-mono text-sm font-semibold text-[#236b91] tabular-nums dark:text-sky-300">
                                        {item.utr.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
});

function Metric({ label, value, title }: { label: string; value: string; title: string }) {
    return (
        <div className="flex min-w-0 items-center gap-1" title={title}>
            <span className="whitespace-nowrap font-mono font-bold text-slate-700 tabular-nums dark:text-slate-300">{value}</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
        </div>
    );
}

UtrSection.displayName = 'UtrSection';
