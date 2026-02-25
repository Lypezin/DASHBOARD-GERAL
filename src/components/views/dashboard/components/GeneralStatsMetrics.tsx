import React from 'react';
import { ArrowUp, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { StatisticCard } from './StatisticCard';
import { GapIndicatorCard } from './GapIndicatorCard';

interface GeneralStatsMetricsProps {
    stats: {
        planejado: string | number;
        entregue: string | number;
        gap: string | null;
        statusColor: string;
    };
    sparklinePlanejado?: number[];
    sparklineEntregue?: number[];
}

export const GeneralStatsMetrics = React.memo(function GeneralStatsMetrics({ stats, sparklinePlanejado, sparklineEntregue }: GeneralStatsMetricsProps) {
    return (
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Tempo Planejado */}
            <StatisticCard
                title="Tempo Planejado"
                value={stats.planejado}
                tooltipText="Total de horas agendadas em escala."
                icon={Clock}
                badge={{
                    text: "Meta",
                    icon: ArrowUp,
                    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-900/50"
                }}
                gradientFrom="from-blue-50 dark:from-blue-900/20"
                gradientTo="to-blue-100 dark:to-blue-800/20"
                iconColor="text-blue-600 dark:text-blue-400"
                bgGlowColor="bg-blue-50 dark:bg-blue-900/10"
                sparklineData={sparklinePlanejado}
                sparklineColor="#3b82f6"
            />

            {/* Tempo Entregue */}
            <StatisticCard
                title="Tempo Entregue"
                value={stats.entregue}
                tooltipText="Horas efetivamente trabalhadas."
                icon={TrendingUp}
                statusColor={stats.statusColor}
                badge={{
                    text: "Realizado",
                    icon: CheckCircle2,
                    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50"
                }}
                gradientFrom="from-emerald-50 dark:from-emerald-900/20"
                gradientTo="to-emerald-100 dark:to-emerald-800/20"
                iconColor="text-emerald-600 dark:text-emerald-400"
                bgGlowColor="bg-emerald-50 dark:bg-emerald-900/10"
                sparklineData={sparklineEntregue}
                sparklineColor="#10b981"
            />

            {/* Gap Indicator */}
            {stats.gap && (
                <GapIndicatorCard gap={stats.gap} />
            )}
        </div>
    );
});
