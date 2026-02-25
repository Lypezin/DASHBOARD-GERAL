
import React, { useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia } from '@/types';
import { motion } from 'framer-motion';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGeneralStats } from './hooks/useGeneralStats';
import { GeneralStatsScoreCard } from './components/GeneralStatsScoreCard';
import { GeneralStatsMetrics } from './components/GeneralStatsMetrics';
import { converterHorasParaDecimal } from '@/utils/formatters';

interface DashboardGeneralStatsProps {
    aderenciaGeral?: AderenciaSemanal;
    aderenciaDia?: AderenciaDia[];
}

export const DashboardGeneralStats = React.memo(function DashboardGeneralStats({
    aderenciaGeral,
    aderenciaDia,
}: DashboardGeneralStatsProps) {

    // Calcular gap de performance using custom hook
    const stats = useGeneralStats(aderenciaGeral);

    // Extract sparkline data from aderenciaDia
    const sparklineData = useMemo(() => {
        if (!aderenciaDia || aderenciaDia.length < 2) return { planejado: undefined, entregue: undefined };

        // Use last 8 days max for sparkline
        const days = aderenciaDia.slice(-8);

        return {
            planejado: days.map(d => d.segundos_planejados || converterHorasParaDecimal(d.horas_a_entregar || '0') * 3600),
            entregue: days.map(d => d.segundos_realizados || converterHorasParaDecimal(d.horas_entregues || '0') * 3600),
        };
    }, [aderenciaDia]);

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
                <GeneralStatsMetrics
                    stats={stats}
                    sparklinePlanejado={sparklineData.planejado}
                    sparklineEntregue={sparklineData.entregue}
                />
            </motion.div>
        </TooltipProvider>
    );
});
