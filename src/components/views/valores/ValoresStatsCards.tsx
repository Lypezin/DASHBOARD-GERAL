import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Car, BarChart3 } from 'lucide-react';

interface ValoresStatsCardsProps {
    totalGeral: number;
    totalEntregadores: number;
    totalCorridas: number;
    taxaMediaGeral: number;
    formatarReal: (valor: number | null | undefined) => string;
}

export const ValoresStatsCards = React.memo(function ValoresStatsCards({
    totalGeral,
    totalEntregadores,
    totalCorridas,
    taxaMediaGeral,
    formatarReal,
}: ValoresStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Geral */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {formatarReal(totalGeral)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Soma de todas as taxas
                    </p>
                </CardContent>
            </Card>

            {/* Entregadores */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Entregadores</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalEntregadores.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total de entregadores listados
                    </p>
                </CardContent>
            </Card>

            {/* Total Corridas */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Corridas</CardTitle>
                    <Car className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {totalCorridas.toLocaleString('pt-BR')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Corridas aceitas no período
                    </p>
                </CardContent>
            </Card>

            {/* Taxa Média */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Média</CardTitle>
                    <BarChart3 className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {formatarReal(taxaMediaGeral)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Valor médio por corrida
                    </p>
                </CardContent>
            </Card>
        </div>
    );
});
