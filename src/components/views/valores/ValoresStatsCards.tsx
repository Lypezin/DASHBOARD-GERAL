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

    // Reusable Premium Stat Card
    const StatCard = ({
        title,
        icon: Icon,
        value,
        subtext,
        colorClass,
        bgClass,
        iconBgClass
    }: {
        title: string;
        icon: any;
        value: string | number;
        subtext: string;
        colorClass: string;
        bgClass: string;
        iconBgClass: string;
    }) => (
        <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgClass} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500`} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${iconBgClass} transition-colors duration-300 group-hover:bg-opacity-80`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className={`text-2xl font-bold tracking-tight mb-1 ${colorClass}`}>
                    {value}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-80">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Geral"
                icon={DollarSign}
                value={formatarReal(totalGeral)}
                subtext="Soma de todas as taxas"
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
            />

            <StatCard
                title="Entregadores"
                icon={Users}
                value={totalEntregadores.toLocaleString('pt-BR')}
                subtext="Total de entregadores listados"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            <StatCard
                title="Total Corridas"
                icon={Car}
                value={totalCorridas.toLocaleString('pt-BR')}
                subtext="Corridas aceitas no período"
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900"
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/40"
            />

            <StatCard
                title="Taxa Média"
                icon={BarChart3}
                value={formatarReal(taxaMediaGeral)}
                subtext="Valor médio por corrida"
                colorClass="text-violet-600 dark:text-violet-400"
                bgClass="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-slate-900"
                iconBgClass="bg-violet-100 dark:bg-violet-900/40"
            />
        </div>
    );
});
