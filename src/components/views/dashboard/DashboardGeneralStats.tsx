import React, { useMemo } from 'react';
import { AderenciaSemanal, AderenciaDia } from '@/types';
import { useGeneralStats } from './hooks/useGeneralStats';
import { GeneralStatsScoreCard } from './components/GeneralStatsScoreCard';
import { GeneralStatsMetrics } from './components/GeneralStatsMetrics';
import { GapIndicatorCard } from './components/GapIndicatorCard';
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
        <div className="space-y-3 motion-safe:animate-fade-in">
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-3">
                <GeneralStatsScoreCard
                    percentual={stats.percentual}
                    progressColor={stats.progressColor}
                />

                <GeneralStatsMetrics
                    stats={stats}
                    sparklinePlanejado={sparklineData.planejado}
                    sparklineEntregue={sparklineData.entregue}
                />
            </dl>
            {stats.gap ? <GapIndicatorCard gap={stats.gap} /> : null}
        </div>
    );
});
