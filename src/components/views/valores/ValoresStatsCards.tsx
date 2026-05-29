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
    totalGeral, totalEntregadores, totalCorridas, taxaMediaGeral, formatarReal,
}: ValoresStatsCardsProps) {
    const StatCard = ({ title, icon: Icon, value, subtext, colorClass, bgClass, iconBgClass }: {
        title: string;
        icon: any;
        value: string | number;
        subtext: string;
        colorClass: string;
        bgClass: string;
        iconBgClass: string;
    }) => (
        <Card className="group relative overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-100 transition-[background-color,box-shadow] duration-200 hover:shadow-md dark:bg-slate-900 dark:ring-slate-800">
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-bl-full bg-gradient-to-br ${bgClass} opacity-10 transition-transform duration-200 group-hover:scale-[1.03]`} />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </CardTitle>
                <div className={`rounded-lg p-2 transition-colors duration-300 group-hover:bg-opacity-80 ${iconBgClass}`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className={`mb-1 text-2xl font-bold tracking-tight ${colorClass}`}>
                    {value}
                </div>
                <p className="text-xs font-medium text-slate-500 opacity-80 dark:text-slate-400">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
                title="Total Geral"
                icon={DollarSign}
                value={formatarReal(totalGeral)}
                subtext="Soma de todas as taxas"
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
            />

            <StatCard
                title="Entregadores"
                icon={Users}
                value={totalEntregadores.toLocaleString('pt-BR')}
                subtext="Total de entregadores listados"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            <StatCard
                title="Total Corridas"
                icon={Car}
                value={totalCorridas.toLocaleString('pt-BR')}
                subtext="Corridas aceitas no periodo"
                colorClass="text-sky-600 dark:text-sky-300"
                bgClass="from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900"
                iconBgClass="bg-sky-100 dark:bg-sky-900/40"
            />

            <StatCard
                title="Taxa Media"
                icon={BarChart3}
                value={formatarReal(taxaMediaGeral)}
                subtext="Valor medio por corrida"
                colorClass="text-teal-600 dark:text-teal-400"
                bgClass="from-teal-50 to-white dark:from-teal-900/20 dark:to-slate-900"
                iconBgClass="bg-teal-100 dark:bg-teal-900/40"
            />
        </div>
    );
});
