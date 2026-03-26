'use client';

import React from 'react';
import { MarketingStatCard } from './components/MarketingStatCard';
import { BarChart3, Send, CheckCircle2, Rocket, RotateCcw } from 'lucide-react';
import { MarketingTotals } from '@/types';

interface MarketingStatsCardsProps {
    totals: MarketingTotals;
}

export const MarketingStatsCards = React.memo(function MarketingStatsCards({
    totals,
}: MarketingStatsCardsProps) {
    const safeTotals = {
        criado: totals?.criado || 0,
        enviado: totals?.enviado || 0,
        liberado: totals?.liberado || 0,
        rodandoInicio: totals?.rodandoInicio || 0,
        aberto: totals?.aberto || 0,
        voltou: totals?.voltou || 0
    };

    const cardConfigs = [
        {
            title: "Criado",
            icon: BarChart3,
            value: safeTotals.criado.toLocaleString('pt-BR'),
            subtext: "Total criado",
            colorClass: "text-blue-600 dark:text-blue-400",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-blue-100 dark:bg-blue-900/40"
        },
        {
            title: "Enviado",
            icon: Send,
            value: safeTotals.enviado.toLocaleString('pt-BR'),
            subtext: "Total enviado",
            colorClass: "text-emerald-600 dark:text-emerald-400",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-emerald-100 dark:bg-emerald-900/40"
        },
        {
            title: "Liberado",
            icon: CheckCircle2,
            value: safeTotals.liberado.toLocaleString('pt-BR'),
            subtext: "Total liberado",
            colorClass: "text-purple-600 dark:text-purple-400",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-purple-100 dark:bg-purple-900/40"
        },
        {
            title: "Rodando Início",
            icon: Rocket,
            value: safeTotals.rodandoInicio.toLocaleString('pt-BR'),
            subtext: "Total rodando início",
            colorClass: "text-orange-600 dark:text-orange-400",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-orange-100 dark:bg-orange-900/40"
        },
        {
            title: "Aberto",
            icon: Send,
            value: safeTotals.aberto.toLocaleString('pt-BR'),
            subtext: "Total aberto",
            colorClass: "text-cyan-600 dark:text-cyan-400",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-cyan-100 dark:bg-cyan-900/40"
        },
        {
            title: "Voltou",
            icon: RotateCcw,
            value: safeTotals.voltou.toLocaleString('pt-BR'),
            subtext: "Total voltou",
            colorClass: "text-rose-600 dark:text-rose-400",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-rose-100 dark:bg-rose-900/40"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cardConfigs.map((config, index) => (
                <MarketingStatCard key={index} {...config} />
            ))}
        </div>
    );
});
