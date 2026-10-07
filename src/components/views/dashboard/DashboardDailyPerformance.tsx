import React from 'react';
import { AderenciaDia } from '@/types';
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
        <section aria-labelledby="overview-daily-title" className="min-w-0 overflow-hidden rounded-xl border border-[#d8e4eb] bg-white shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-900">
            <header className="flex min-w-0 flex-col gap-3 border-b border-[#e2ebf0] px-4 py-4 dark:border-slate-800 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h2 id="overview-daily-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Evolução diária</h2>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Aderência, horas realizadas, meta e corridas por dia.</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-2 border-t border-[#e2ebf0] pt-3 dark:border-slate-800 sm:w-fit sm:gap-x-6 lg:border-0 lg:pt-0">
                    <div>
                        <dt className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Média do período</dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#183f58] dark:text-slate-100">{media.toFixed(1)}%</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Melhor dia</dt>
                        <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[#183f58] dark:text-slate-100" title={resumo.melhor.label}>
                            {resumo.melhor.label} <span className="text-[#347ca3] dark:text-sky-300">{resumo.melhor.valor.toFixed(1)}%</span>
                        </dd>
                    </div>
                </dl>
            </header>

            <div className="subtle-scrollbar overflow-x-auto">
                <div className="grid min-w-[1180px] grid-cols-7 divide-x divide-[#e2ebf0] dark:divide-slate-800">
                    {aderenciaDiaOrdenada.map((dia, index) => (
                        <DailyPerformanceCard
                            key={`dia-${index}`}
                            dia={dia}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
});

DashboardDailyPerformance.displayName = 'DashboardDailyPerformance';
