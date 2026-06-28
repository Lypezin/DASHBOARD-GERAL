import React, { useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia } from '@/types';
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
    const stats = useGeneralStats(aderenciaGeral);

    const sparklineData = useMemo(() => {
        if (!aderenciaDia || aderenciaDia.length < 2) return { planejado: undefined, entregue: undefined };

        const days = aderenciaDia.slice(-8);

        return {
            planejado: days.map(d => d.segundos_planejados || converterHorasParaDecimal(d.horas_a_entregar || '0') * 3600),
            entregue: days.map(d => d.segundos_realizados || converterHorasParaDecimal(d.horas_entregues || '0') * 3600),
        };
    }, [aderenciaDia]);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 gap-4 motion-safe:animate-fade-in lg:grid-cols-12">
            <GeneralStatsScoreCard
                percentual={stats.percentual}
                progressColor={stats.progressColor}
            />

            <GeneralStatsMetrics
                stats={stats}
                sparklinePlanejado={sparklineData.planejado}
                sparklineEntregue={sparklineData.entregue}
            />
        </div>
    );
});
