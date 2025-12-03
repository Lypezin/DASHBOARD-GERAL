import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Timer, Car, Activity } from 'lucide-react';
import { UtrGeral as UtrGeralType } from '@/types';

interface UtrGeralProps {
    data: UtrGeralType;
}

export const UtrGeral = React.memo(function UtrGeral({ data }: UtrGeralProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                            UTR Geral
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Taxa de Utilização de Recursos consolidada
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Tempo Total */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-500">Tempo Total</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                            {(data.tempo_horas ?? 0).toFixed(2)}h
                        </p>
                    </div>

                    {/* Corridas */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <Car className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-500">Corridas</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                            {(data.corridas ?? 0).toLocaleString()}
                        </p>
                    </div>

                    {/* UTR Score */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Score UTR</span>
                        </div>
                        <p className="text-3xl font-black text-blue-700 dark:text-blue-300 font-mono">
                            {(data.utr ?? 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
