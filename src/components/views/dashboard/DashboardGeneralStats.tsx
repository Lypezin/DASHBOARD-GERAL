import React, { useMemo } from 'react';
import { AderenciaSemanal } from '@/types';
import { formatarHorasParaHMS, converterHorasParaDecimal } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    LayoutDashboard,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface DashboardGeneralStatsProps {
    aderenciaGeral?: AderenciaSemanal;
}

export const DashboardGeneralStats = React.memo(function DashboardGeneralStats({
    aderenciaGeral,
}: DashboardGeneralStatsProps) {
    const { theme } = useTheme();

    // Calcular gap de performance
    const calcularGap = useMemo(() => {
        if (!aderenciaGeral) return null;
        const planejadoStr = aderenciaGeral.horas_a_entregar || '0';
        const entregueStr = aderenciaGeral.horas_entregues || '0';

        const planejado = converterHorasParaDecimal(planejadoStr);
        const entregue = converterHorasParaDecimal(entregueStr);
        const gap = Math.max(0, planejado - entregue);

        return {
            horas: gap,
            formatado: formatarHorasParaHMS(gap)
        };
    }, [aderenciaGeral]);

    if (!aderenciaGeral) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Principal - Gráfico */}
            <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4 text-slate-500" />
                            Aderência Geral
                        </CardTitle>
                        <Badge variant="outline" className="font-normal text-xs">
                            Consolidado
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <div className="relative">
                        <CircularProgress
                            value={aderenciaGeral.aderencia_percentual ?? 0}
                            size={200}
                            strokeWidth={16}
                            color={
                                (aderenciaGeral.aderencia_percentual ?? 0) >= 90
                                    ? (theme === 'dark' ? '#10b981' : '#059669')
                                    : (aderenciaGeral.aderencia_percentual ?? 0) >= 70
                                        ? (theme === 'dark' ? '#3b82f6' : '#2563eb')
                                        : (theme === 'dark' ? '#ef4444' : '#dc2626')
                            }
                            backgroundColor={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                            showLabel={true}
                            label="Total"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Cards de Métricas */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tempo Planejado */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Planejado</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                            {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar || '0')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total de horas escaladas
                        </p>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full w-full opacity-60"></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tempo Entregue */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Entregue</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                            {formatarHorasParaHMS(aderenciaGeral.horas_entregues || '0')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total de horas realizadas
                        </p>
                        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(((aderenciaGeral.aderencia_percentual ?? 0) / 100) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Gap de Performance */}
                {calcularGap && (
                    <Card className="sm:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Gap de Performance</CardTitle>
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                    {calcularGap.formatado}
                                </div>
                                <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                    não entregues
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Diferença entre planejado e realizado
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
});
