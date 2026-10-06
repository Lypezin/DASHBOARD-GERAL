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
        <section aria-labelledby="entregadores-resumo-title" className="space-y-3">
            <h2 id="entregadores-resumo-title" className="text-sm font-semibold tracking-tight text-[#242b26] dark:text-slate-100">
                Resumo da frota
            </h2>
            <motion.dl
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion ? undefined : 'visible'}
                variants={reduceMotion ? undefined : containerVariants}
                className="grid grid-cols-1 gap-x-5 gap-y-4 border-y border-[#d6dcd5] py-3 dark:border-slate-700 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:divide-x xl:divide-[#e8ece7] dark:xl:divide-slate-700"
            >
                {metrics.map((metric) => (
                    <EntregadoresOverviewMetric key={metric.label} {...metric} reduceMotion={reduceMotion} />
                ))}
            </motion.dl>
        </section>
    );
});

EntregadoresMainStatsCards.displayName = 'EntregadoresMainStatsCards';
