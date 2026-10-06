'use client';

import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { SaasMetric } from '@/components/views/shared/SaasPrimitives';
import { EntregadoresOverviewMetric } from './components/EntregadoresOverviewMetric';
import { createEntregadoresMetrics } from './utils/entregadoresMetrics';

interface EntregadoresMainStatsCardsProps {
    totalEntregadores: number;
    aderenciaMedia: number;
    rejeicaoMedia: number;
    totalCorridas: number;
    totalHoras: string;
    totalTitle?: string;
    totalSubtext?: string;
    corridasTitle?: string;
    corridasSubtext?: string;
    variant?: 'entregadores' | 'dedicado';
}

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.04, staggerChildren: 0.04 } },
};

export const EntregadoresMainStatsCards = React.memo(function EntregadoresMainStatsCards({
    variant = 'entregadores',
    ...stats
}: EntregadoresMainStatsCardsProps) {
    const reduceMotion = useReducedMotion() ?? true;
    const metrics = createEntregadoresMetrics(stats);

    if (variant === 'dedicado') {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {metrics.map((metric) => (
                    <SaasMetric
                        key={metric.label}
                        icon={metric.icon}
                        label={metric.label}
                        value={metric.value}
                        meta={metric.meta}
                        tone={metric.tone}
                        size="lg"
                        className="p-5"
                        truncate={metric.label === 'Total de horas'}
                    />
                ))}
            </div>
        );
    }

    return (
        <section aria-labelledby="entregadores-resumo-title" className="space-y-2.5">
            <div className="flex items-end justify-between gap-3 px-0.5">
                <div>
                    <h2 id="entregadores-resumo-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
                        Visão da frota
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Indicadores do período selecionado</p>
                </div>
                <span className="hidden text-[11px] font-medium text-slate-400 sm:block">Atualizado com os filtros ativos</span>
            </div>
            <motion.dl
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion ? undefined : 'visible'}
                variants={reduceMotion ? undefined : containerVariants}
                className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            >
                {metrics.map((metric) => (
                    <EntregadoresOverviewMetric key={metric.label} {...metric} reduceMotion={reduceMotion} />
                ))}
            </motion.dl>
        </section>
    );
});

EntregadoresMainStatsCards.displayName = 'EntregadoresMainStatsCards';
