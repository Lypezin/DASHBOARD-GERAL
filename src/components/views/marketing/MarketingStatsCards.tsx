import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Send, CheckCircle2, Rocket } from 'lucide-react';
import { MarketingTotals } from '@/types';

interface MarketingStatsCardsProps {
    totals: MarketingTotals;
}

export const MarketingStatsCards = React.memo(function MarketingStatsCards({
    totals,
}: MarketingStatsCardsProps) {

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
        <Card className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden relative ${bgClass}`}>
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
                <Icon className="w-16 h-16" />
            </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${iconBgClass} transition-shadow duration-300 group-hover:shadow-md`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className={`text-2xl font-bold tracking-tight ${colorClass} font-mono mb-1`}>
                    {value}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-80">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Criado"
                icon={BarChart3}
                value={totals.criado.toLocaleString('pt-BR')}
                subtext="Total criado"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            <StatCard
                title="Enviado"
                icon={Send}
                value={totals.enviado.toLocaleString('pt-BR')}
                subtext="Total enviado"
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
            />

            <StatCard
                title="Liberado"
                icon={CheckCircle2}
                value={totals.liberado.toLocaleString('pt-BR')}
                subtext="Total liberado"
                colorClass="text-purple-600 dark:text-purple-400"
                bgClass="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900"
                iconBgClass="bg-purple-100 dark:bg-purple-900/40"
            />

            <StatCard
                title="Rodando Início"
                icon={Rocket}
                value={totals.rodandoInicio.toLocaleString('pt-BR')}
                subtext="Total rodando início"
                colorClass="text-orange-600 dark:text-orange-400"
                bgClass="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900"
                iconBgClass="bg-orange-100 dark:bg-orange-900/40"
            />
        </div>
    );
});
