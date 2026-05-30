import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { AderenciaDia } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card className="overflow-hidden rounded-[1.65rem] border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] animate-fade-in dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardContent className="p-0">
                <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.88))] p-4 dark:border-slate-800/80 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.88))] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Semana operacional
                        </div>
                        <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
                            Leitura diaria consolidada em uma linha de desempenho, com volume realizado, meta e corridas por dia.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
                        <SummaryPill label="Media" value={`${media.toFixed(1)}%`} />
                        <SummaryPill
                            label={`Melhor: ${resumo.melhor.label.substring(0, 3)}`}
                            value={`${resumo.melhor.valor.toFixed(1)}%`}
                            highlight
                        />
                    </div>
                </div>

                <div className="subtle-scrollbar overflow-x-auto p-3 sm:p-4">
                    <div className="grid min-w-[980px] grid-cols-7 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/80 shadow-inner dark:border-slate-800/80 dark:bg-slate-900/40">
                        {aderenciaDiaOrdenada.map((dia, index) => (
                            <DailyPerformanceCard
                                key={`dia-${index}`}
                                dia={dia}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

DashboardDailyPerformance.displayName = 'DashboardDailyPerformance';

function SummaryPill({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {highlight && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                {label}
            </div>
            <div className={highlight ? "mt-1 font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400" : "mt-1 font-mono text-base font-semibold text-slate-950 dark:text-slate-100"}>
                {value}
            </div>
        </div>
    );
}
