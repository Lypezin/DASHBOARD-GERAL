import React from 'react';
import { Car, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    gridCols = 'sm:grid-cols-2 xl:grid-cols-3'
}: UtrSectionProps<T>) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="space-y-3 border-b border-slate-100 px-6 pb-5 pt-6 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                            {title}
                        </CardTitle>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    </div>
                </div>
            </CardHeader>

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
                                className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-colors hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                            >
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p
                                            className="truncate text-sm font-semibold leading-5 text-slate-900 dark:text-white"
                                            title={label || 'N/D'}
                                        >
                                            {label || 'N/D'}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                            Indicador UTR
                                        </p>
                                    </div>

                                    <div className="shrink-0 rounded-xl bg-slate-900 px-2.5 py-1 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                                        {item.utr.toFixed(2)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                                        <div className="mb-1 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <Timer className="h-3.5 w-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-[0.16em]">Tempo</span>
                                        </div>
                                        <p
                                            className="truncate text-sm font-semibold text-slate-900 dark:text-white"
                                            title={fullTime}
                                        >
                                            {compactTime}
                                        </p>
                                        <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400" title={fullTime}>{fullTime}</p>
                                    </div>

                                    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
                                        <div className="mb-1 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <Car className="h-3.5 w-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-[0.16em]">Corridas</span>
                                        </div>
                                        <p
                                            className="truncate text-sm font-semibold text-slate-900 dark:text-white"
                                            title={formattedCorridas}
                                        >
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
