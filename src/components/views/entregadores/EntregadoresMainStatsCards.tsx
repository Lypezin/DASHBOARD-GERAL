import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, XCircle, Truck, Clock } from 'lucide-react';

interface EntregadoresMainStatsCardsProps { totalEntregadores: number; aderenciaMedia: number; rejeicaoMedia: number; totalCorridas: number; totalHoras: string; }

export const EntregadoresMainStatsCards = React.memo(function EntregadoresMainStatsCards({ totalEntregadores, aderenciaMedia, rejeicaoMedia, totalCorridas, totalHoras }: EntregadoresMainStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Entregadores */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entregadores</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalEntregadores.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Entregadores listados
                    </p>
                </CardContent>
            </Card>

            {/* Aderência Média */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Aderência Média</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {aderenciaMedia.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(aderenciaMedia, 100)}%` }}></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rejeição Média */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Rejeição Média</CardTitle>
                    <XCircle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {rejeicaoMedia.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(rejeicaoMedia, 100)}%` }}></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Total Corridas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Corridas Completas</CardTitle>
                    <Truck className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalCorridas.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total completado
                    </p>
                </CardContent>
            </Card>

            {/* Total Horas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Horas</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold text-slate-900 dark:text-white font-mono truncate" title={totalHoras}>
                        {totalHoras}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Horas totais
                    </p>
                </CardContent>
            </Card>
        </div>
    );
});
