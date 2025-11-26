import React, { useState, useMemo } from 'react';
import { AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ListChecks,
    TrendingUp,
    TrendingDown,
    BarChart3
} from 'lucide-react';

interface DashboardOperationalDetailProps {
    aderenciaTurno: AderenciaTurno[];
    aderenciaSubPraca: AderenciaSubPraca[];
    aderenciaOrigem: AderenciaOrigem[];
}

export const DashboardOperationalDetail = React.memo(function DashboardOperationalDetail({
    aderenciaTurno,
    aderenciaSubPraca,
    aderenciaOrigem,
}: DashboardOperationalDetailProps) {
    const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');

    // Dados para renderização com base no viewMode
    const dataToRender = useMemo(() => {
        switch (viewMode) {
            case 'turno':
                return aderenciaTurno.map(item => ({
                    label: item.turno || 'N/A',
                    aderencia: item.aderencia_percentual || 0,
                    horasAEntregar: item.horas_a_entregar || '0',
                    horasEntregues: item.horas_entregues || '0'
                }));
            case 'sub_praca':
                return aderenciaSubPraca.map(item => ({
                    label: item.sub_praca || 'N/A',
                    aderencia: item.aderencia_percentual || 0,
                    horasAEntregar: item.horas_a_entregar || '0',
                    horasEntregues: item.horas_entregues || '0'
                }));
            case 'origem':
                return aderenciaOrigem.map(item => ({
                    label: item.origem || 'N/A',
                    aderencia: item.aderencia_percentual || 0,
                    horasAEntregar: item.horas_a_entregar || '0',
                    horasEntregues: item.horas_entregues || '0'
                }));
            default:
                return [];
        }
    }, [viewMode, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem]);

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <ListChecks className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Detalhamento Operacional</CardTitle>
                            <CardDescription>Análise segmentada por categorias</CardDescription>
                        </div>
                    </div>

                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {(['turno', 'sub_praca', 'origem'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === mode
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {mode === 'sub_praca' ? 'Sub Praça' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {dataToRender.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dataToRender.map((item, index) => {
                            const statusColor = item.aderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                                item.aderencia >= 70 ? 'text-blue-600 dark:text-blue-400' :
                                    'text-rose-600 dark:text-rose-400';

                            const barColor = item.aderencia >= 90 ? 'bg-emerald-500' :
                                item.aderencia >= 70 ? 'bg-blue-500' :
                                    'bg-rose-500';

                            const Icon = item.aderencia >= 70 ? TrendingUp : TrendingDown;

                            return (
                                <div key={`${viewMode}-${index}`} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate pr-2" title={item.label}>
                                            {item.label}
                                        </h3>
                                        <Badge variant={item.aderencia >= 90 ? 'default' : item.aderencia >= 70 ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5 font-normal">
                                            {item.aderencia.toFixed(1)}%
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-full ${item.aderencia >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                                            <Icon className={`h-4 w-4 ${statusColor}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${barColor} rounded-full`}
                                                    style={{ width: `${Math.min(item.aderencia, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                            <span>Plan:</span>
                                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(item.horasAEntregar)}</span>
                                        </div>
                                        <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                            <span>Real:</span>
                                            <span className={`font-mono font-medium ${statusColor}`}>{formatarHorasParaHMS(item.horasEntregues)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">Nenhum dado disponível</p>
                        <p className="text-xs mt-1 opacity-70">
                            Ajuste os filtros para visualizar os dados
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
