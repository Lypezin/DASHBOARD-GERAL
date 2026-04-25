import React from 'react';
import { Car, Timer } from 'lucide-react';
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
    gridCols?: string;
}

export const UtrSection = React.memo(function UtrSection<T extends UtrItemBase>({
    title,
    description,
    icon,
    data,
    getLabel,
    gridCols = 'sm:grid-cols-2 2xl:grid-cols-3'
}: UtrSectionProps<T>) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            <CardContent className="p-6">
                <div className={cn('grid grid-cols-1 gap-4', gridCols)}>
                    {data.map((item, index) => {
                        const label = getLabel(item);
                        const fullTime = formatarHorasParaHMS(item.tempo_horas ?? 0);
                        const compactTime = formatCompactTime(fullTime);
                        const formattedCorridas = (item.corridas ?? 0).toLocaleString('pt-BR');

                        return (
                            <div
                                key={`${label}-${index}`}
                                className="flex flex-col gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200" title={label || 'N/D'}>
                                        {label || 'N/D'}
                                    </p>
                                    <div className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        UTR {item.utr.toFixed(2)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <div className="flex flex-col rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-950 dark:ring-slate-800">
                                        <div className="mb-1 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                            <Timer className="h-3 w-3" />
                                            <span className="text-[10px] font-medium uppercase tracking-wider">Tempo</span>
                                        </div>
                                        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300" title={fullTime}>
                                            {compactTime}
                                        </p>
                                    </div>

                                    <div className="flex flex-col rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-950 dark:ring-slate-800">
                                        <div className="mb-1 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                            <Car className="h-3 w-3" />
                                            <span className="text-[10px] font-medium uppercase tracking-wider">Corridas</span>
                                        </div>
                                        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300" title={formattedCorridas}>
                                            {formattedCorridas}
                                        </p>
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
