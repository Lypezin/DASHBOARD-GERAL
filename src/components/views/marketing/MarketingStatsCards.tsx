'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Send, CheckCircle2, Rocket, RotateCcw } from 'lucide-react';
import { MarketingTotals } from '@/types';

interface MarketingStatsCardsProps {
    totals: MarketingTotals;
}

export const MarketingStatsCards = React.memo(function MarketingStatsCards({
    totals,
}: MarketingStatsCardsProps) {
    // Garantir que temos valores padrão caso algum campo venha undefined
    const safeTotals = {
        criado: totals?.criado || 0,
        enviado: totals?.enviado || 0,
        liberado: totals?.liberado || 0,
        rodandoInicio: totals?.rodandoInicio || 0,
        aberto: totals?.aberto || 0,
        voltou: totals?.voltou || 0
    };

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
        icon: React.ElementType;
        value: string | number;
        subtext: string;
        colorClass: string;
        bgClass: string;
        iconBgClass: string;
    }) => (
        <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800/50 backdrop-blur-sm">

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${iconBgClass} transition-colors duration-300 group-hover:bg-opacity-80`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className={`text-3xl font-bold tracking-tight ${colorClass} mb-2`}>
                    {value}
                </div>
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${iconBgClass}`} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {subtext}
                    </p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
                title="Criado"
                icon={BarChart3}
                value={safeTotals.criado.toLocaleString('pt-BR')}
                subtext="Total criado"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-white dark:bg-slate-900"
                iconBgClass="bg-blue-100 dark:bg-blue-900/40"
            />

            <StatCard
                title="Enviado"
                icon={Send}
                value={safeTotals.enviado.toLocaleString('pt-BR')}
                subtext="Total enviado"
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-white dark:bg-slate-900"
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
            />

            <StatCard
                title="Liberado"
                icon={CheckCircle2}
                value={safeTotals.liberado.toLocaleString('pt-BR')}
                subtext="Total liberado"
                colorClass="text-purple-600 dark:text-purple-400"
                bgClass="bg-white dark:bg-slate-900"
                iconBgClass="bg-purple-100 dark:bg-purple-900/40"
            />

            <StatCard
                title="Rodando Início"
                icon={Rocket}
                value={safeTotals.rodandoInicio.toLocaleString('pt-BR')}
                subtext="Total rodando início"
                colorClass="text-orange-600 dark:text-orange-400"
                bgClass="bg-white dark:bg-slate-900"
                iconBgClass="bg-orange-100 dark:bg-orange-900/40"
            />

            <StatCard
                title="Aberto"
                icon={Send}
                value={safeTotals.aberto.toLocaleString('pt-BR')}
                subtext="Total aberto"
                colorClass="text-cyan-600 dark:text-cyan-400"
                bgClass="bg-white dark:bg-slate-900"
                iconBgClass="bg-cyan-100 dark:bg-cyan-900/40"
            />

            <StatCard
                title="Voltou"
                icon={RotateCcw}
                value={safeTotals.voltou.toLocaleString('pt-BR')}
                subtext="Total voltou"
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-white dark:bg-slate-900"
                iconBgClass="bg-rose-100 dark:bg-rose-900/40"
            />
        </div>
    );
});
