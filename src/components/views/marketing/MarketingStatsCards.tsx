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
            colorClass: "text-slate-700 dark:text-slate-300",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-slate-100 dark:bg-slate-800"
        },
        {
            title: "Enviado",
            icon: Send,
            value: safeTotals.enviado.toLocaleString('pt-BR'),
            subtext: "Total enviado",
            colorClass: "text-slate-700 dark:text-slate-300",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-slate-100 dark:bg-slate-800"
        },
        {
            title: "Liberado",
            icon: CheckCircle2,
            value: safeTotals.liberado.toLocaleString('pt-BR'),
            subtext: "Total liberado",
            colorClass: "text-slate-700 dark:text-slate-300",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-slate-100 dark:bg-slate-800"
        },
        {
            title: "Rodando Início",
            icon: Rocket,
            value: safeTotals.rodandoInicio.toLocaleString('pt-BR'),
            subtext: "Total rodando",
            colorClass: "text-slate-700 dark:text-slate-300",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-slate-100 dark:bg-slate-800"
        },
        {
            title: "Aberto",
            icon: Send,
            value: safeTotals.aberto.toLocaleString('pt-BR'),
            subtext: "Total em aberto",
            colorClass: "text-slate-700 dark:text-slate-300",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-slate-100 dark:bg-slate-800"
        },
        {
            title: "Voltou",
            icon: RotateCcw,
            value: safeTotals.voltou.toLocaleString('pt-BR'),
            subtext: "Total retorno",
            colorClass: "text-slate-700 dark:text-slate-300",
            bgClass: "bg-white dark:bg-slate-900",
            iconBgClass: "bg-slate-100 dark:bg-slate-800"
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
