
import React from 'react';
import { AderenciaSemanal } from '@/types';
import { motion } from 'framer-motion';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGeneralStats } from './hooks/useGeneralStats';
import { GeneralStatsScoreCard } from './components/GeneralStatsScoreCard';
import { GeneralStatsMetrics } from './components/GeneralStatsMetrics';

interface DashboardGeneralStatsProps {
    aderenciaGeral?: AderenciaSemanal;
}

export const DashboardGeneralStats = React.memo(function DashboardGeneralStats({
    aderenciaGeral,
}: DashboardGeneralStatsProps) {

    // Calcular gap de performance using custom hook
    const stats = useGeneralStats(aderenciaGeral);

    if (!stats) return null;

    return (
        <TooltipProvider delayDuration={0}>
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* Main Score Card */}
                <GeneralStatsScoreCard
                    percentual={stats.percentual}
                    progressColor={stats.progressColor}
                />

                {/* Metrics Grid */}
                <GeneralStatsMetrics stats={stats} />
            </motion.div>
        </TooltipProvider>
    );
});
