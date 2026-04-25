import React from 'react';
import { Activity, Car, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UtrGeral as UtrGeralType } from '@/types';
import { formatCompactTime, formatarHorasParaHMS } from '@/utils/formatters';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    const fullTime = formatarHorasParaHMS(data.tempo_horas ?? 0);
    const compactTime = formatCompactTime(fullTime);
    const formattedCorridas = (data.corridas ?? 0).toLocaleString('pt-BR');

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {/* UTR Index Card */}
            <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white dark:bg-slate-950 dark:border-slate-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">UTR Consolidada</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Índice geral do período</p>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Activity className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            {(data.utr ?? 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">índice</span>
                    </div>
                </CardContent>
            </Card>

            {/* Tempo Card */}
            <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white dark:bg-slate-950 dark:border-slate-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Tempo Total</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Carga horária operacional</p>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                            <Timer className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50" title={fullTime}>
                            {compactTime}
                        </span>
                        <span className="text-xs text-slate-500 font-mono" title={fullTime}>{fullTime}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Corridas Card */}
            <Card className="rounded-2xl border-slate-200/60 shadow-sm bg-white dark:bg-slate-950 dark:border-slate-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Total de Corridas</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Volume consolidado</p>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <Car className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            {formattedCorridas}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});
