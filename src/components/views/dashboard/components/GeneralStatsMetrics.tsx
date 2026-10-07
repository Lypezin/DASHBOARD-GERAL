import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { StatisticCard } from './StatisticCard';

interface GeneralStatsMetricsProps {
    stats: {
        planejado: string | number;
        entregue: string | number;
        statusColor: string;
    };
    sparklinePlanejado?: number[];
    sparklineEntregue?: number[];
}

export const GeneralStatsMetrics = React.memo(function GeneralStatsMetrics({
    stats,
    sparklinePlanejado,
    sparklineEntregue,
}: GeneralStatsMetricsProps) {
    return (
        <>
            <StatisticCard
                title="Tempo planejado"
                value={stats.planejado}
                tooltipText="Total de horas agendadas em escala."
                icon={Clock}
                meta="Meta de horas do período"
                sparklineData={sparklinePlanejado}
                sparklineColor="#347ca3"
            />

            <StatisticCard
                title="Tempo entregue"
                value={stats.entregue}
                tooltipText="Horas efetivamente trabalhadas."
                icon={TrendingUp}
                statusColor={stats.statusColor}
                meta="Horas efetivamente trabalhadas"
                sparklineData={sparklineEntregue}
                sparklineColor="#10b981"
            />
        </>
    );
});
