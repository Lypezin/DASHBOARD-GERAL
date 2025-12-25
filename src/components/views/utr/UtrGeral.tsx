import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Timer, Car, Activity } from 'lucide-react';
import { UtrGeral as UtrGeralType } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl shadow-inner">
                        <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            UTR Geral
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Taxa de Utilização de Recursos consolidada
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Tempo Total */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-300 group">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors">
                                <Timer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tempo Total</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                            {formatarHorasParaHMS(data.tempo_horas ?? 0)}
                        </p>
                    </div>

                    {/* Corridas */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-300 group">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/30 transition-colors">
                                <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Corridas</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                            {(data.corridas ?? 0).toLocaleString()}
                        </p>
                    </div>

                    {/* UTR Score */}
                    <div className="rounded-2xl border-none bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg shadow-blue-500/20 text-white hover:shadow-blue-500/30 transition-all hover:scale-[1.02] duration-300 transform">
                        <div className="flex items-center gap-2 mb-3 opacity-90">
                            <Activity className="h-4 w-4" />
                            <span className="text-sm font-semibold">Score UTR</span>
                        </div>
                        <p className="text-5xl font-black font-mono tracking-tighter">
                            {(data.utr ?? 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
