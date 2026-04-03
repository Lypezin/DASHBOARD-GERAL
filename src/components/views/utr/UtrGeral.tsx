import React from 'react';
import { Activity, Car, Gauge, Timer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UtrGeral as UtrGeralType } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 md:col-span-1 lg:col-span-1">
                <div className="flex h-full flex-col justify-between gap-6 p-6">
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/60">
                            <Gauge className="h-6 w-6 text-sky-700 dark:text-sky-300" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                UTR Geral
                            </p>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Indicador consolidado de utilizacao de recursos para leitura executiva imediata.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                {(data.utr ?? 0).toFixed(2)}
                            </span>
                            <span className="pb-1 text-sm font-medium text-slate-400 dark:text-slate-500">indice</span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                            <Activity className="h-3.5 w-3.5" />
                            Atualizado conforme filtros ativos
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-full flex-col justify-between gap-6 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/50">
                            <Timer className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Tempo total</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Carga consolidada de horas operacionais.</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {formatarHorasParaHMS(data.tempo_horas ?? 0)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Leitura acumulada no recorte atual.</p>
                    </div>
                </div>
            </Card>

            <Card className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-full flex-col justify-between gap-6 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/50">
                            <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Corridas</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Volume total considerado na UTR.</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {(data.corridas ?? 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Base operacional do indicador.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
});
