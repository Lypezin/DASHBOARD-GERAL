import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { AderenciaDia } from '@/types';
import { SaasMetric, SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';
import { useDailyPerformanceData } from './hooks/useDailyPerformanceData';
import { DailyPerformanceCard } from './components/DailyPerformanceCard';

interface DashboardDailyPerformanceProps {
    aderenciaDia: AderenciaDia[];
}

export const DashboardDailyPerformance = React.memo(function DashboardDailyPerformance({
    aderenciaDia,
}: DashboardDailyPerformanceProps) {
    const aderenciaDiaOrdenada = useDailyPerformanceData(aderenciaDia);

    if (aderenciaDiaOrdenada.length === 0) return null;

    const resumo = aderenciaDiaOrdenada.reduce(
        (acc, dia) => {
            const aderencia = dia.aderencia_percentual || 0;

            return {
                total: acc.total + aderencia,
                melhor: aderencia > acc.melhor.valor
                    ? { valor: aderencia, label: dia.dia_da_semana || dia.dia || 'N/A' }
                    : acc.melhor,
            };
        },
        { total: 0, melhor: { valor: 0, label: 'N/A' } }
    );

    const media = resumo.total / aderenciaDiaOrdenada.length;

    return (
        <SaasPanel>
            <SaasPanelHeader
                eyebrow="Semana operacional"
                title="Leitura diária consolidada"
                description="Acompanhe aderência, horas realizadas, meta e corridas por dia sem duplicidade de indicadores."
                icon={CalendarDays}
                actions={(
                    <div className="grid min-w-[280px] grid-cols-2 gap-2">
                        <SaasMetric label="Média" value={`${media.toFixed(1)}%`} />
                        <SaasMetric
                            label={`Melhor: ${resumo.melhor.label.substring(0, 3)}`}
                            value={`${resumo.melhor.valor.toFixed(1)}%`}
                            icon={TrendingUp}
                            tone="emerald"
                        />
                    </div>
                )}
            />

            <div className="subtle-scrollbar overflow-x-auto p-3 sm:p-4">
                <div className="grid min-w-[1180px] grid-cols-7 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/80 shadow-inner dark:border-slate-800/80 dark:bg-slate-900/40">
                    {aderenciaDiaOrdenada.map((dia, index) => (
                        <DailyPerformanceCard
                            key={`dia-${index}`}
                            dia={dia}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </SaasPanel>
    );
});

DashboardDailyPerformance.displayName = 'DashboardDailyPerformance';
