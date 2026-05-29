import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
        <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white dark:bg-slate-950 dark:border-slate-800 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4 bg-slate-50/30 dark:bg-slate-900/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200/50 dark:ring-slate-800 shadow-sm">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            <CardContent className="p-0 flex-1">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data.map((item, index) => {
                        const label = getLabel(item);
                        const fullTime = formatarHorasParaHMS(item.tempo_horas ?? 0);
                        const compactTime = formatCompactTime(fullTime);
                        const formattedCorridas = (item.corridas ?? 0).toLocaleString('pt-BR');

                        return (
                            <div
                                key={`${label}-${index}`}
                                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group"
                            >
                                <div className="flex flex-col min-w-0 pr-4 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={label || 'N/D'}>
                                        {label || 'N/D'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400" title={fullTime}>
                                            <span className="font-medium text-slate-600 dark:text-slate-300">{compactTime}</span>
                                            <span className="ml-1 uppercase text-[9px] tracking-wider font-semibold opacity-70">Tempo</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400" title={formattedCorridas}>
                                            <span className="font-medium text-slate-600 dark:text-slate-300">{formattedCorridas}</span>
                                            <span className="ml-1 uppercase text-[9px] tracking-wider font-semibold opacity-70">Corridas</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 flex flex-col items-end">
                                    <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider mb-0.5">UTR</span>
                                    <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md border border-blue-100/50 dark:border-blue-800/30">
                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                            {item.utr.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
});
