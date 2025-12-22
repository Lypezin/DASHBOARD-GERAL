import React, { useMemo } from 'react';
import { AderenciaSemanal } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Clock, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardGeneralStatsProps {
    aderenciaGeral?: AderenciaSemanal;
}

export const DashboardGeneralStats = React.memo(function DashboardGeneralStats({
    aderenciaGeral,
}: DashboardGeneralStatsProps) {
    const { theme } = useTheme();

    // Calcular gap de performance
    const stats = useMemo(() => {
        if (!aderenciaGeral) return null;
        const planejadoStr = aderenciaGeral.horas_a_entregar || '0';
        const entregueStr = aderenciaGeral.horas_entregues || '0';

        const planejado = converterHorasParaDecimal(planejadoStr);
        const entregue = converterHorasParaDecimal(entregueStr);
        const gap = Math.max(0, planejado - entregue);
        const percentual = aderenciaGeral.aderencia_percentual ?? 0;

        return {
            planejado: formatarHorasParaHMS(planejadoStr),
            entregue: formatarHorasParaHMS(entregueStr),
            gap: gap > 0 ? formatarHorasParaHMS(gap) : null,
            percentual,
            statusColor: percentual >= 90 ? 'text-emerald-500' : percentual >= 70 ? 'text-blue-500' : 'text-rose-500',
            progressColor: percentual >= 90 ? '#10b981' : percentual >= 70 ? '#3b82f6' : '#ef4444'
        };
    }, [aderenciaGeral]);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Score Card */}
            <Card className="lg:col-span-4 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-32 h-32 text-current" />
                </div>

                <CardContent className="flex flex-col items-center justify-center py-10 relative z-10">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Aderência Geral</h3>
                        <p className="text-sm text-slate-400">Desempenho consolidado</p>
                    </div>

                    <div className="relative scale-110 mb-2">
                        <CircularProgress
                            value={stats.percentual}
                            size={180}
                            strokeWidth={12}
                            color={stats.progressColor}
                            backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                            showLabel={true}
                            label="Total"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Tempo Planejado */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 group">
                    <CardContent className="p-6 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tempo Planejado</p>
                            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                                {stats.planejado}
                            </h4>
                            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md w-fit">
                                <ArrowUp className="w-3 h-3" />
                                <span>Meta da Escala</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tempo Entregue */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 group">
                    <CardContent className="p-6 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tempo Entregue</p>
                            <h4 className={`text-3xl font-bold font-mono tracking-tight ${stats.statusColor}`}>
                                {stats.entregue}
                            </h4>
                            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Realizado</span>
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                {/* Gap Indicator (Full Width if present) */}
                {stats.gap && (
                    <Card className="md:col-span-2 border-l-4 border-l-rose-500 shadow-sm bg-rose-50/30 dark:bg-rose-900/10">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-rose-900 dark:text-rose-200">
                                    Atenção: Gap de Entrega
                                </p>
                                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                                    Faltam <span className="font-bold font-mono text-sm">{stats.gap}</span> para atingir a meta planejada.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
});
