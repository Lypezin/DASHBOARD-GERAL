import React, { useMemo } from 'react';
import { AderenciaDia } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

interface DashboardDailyPerformanceProps {
    aderenciaDia: AderenciaDia[];
}

export const DashboardDailyPerformance = React.memo(function DashboardDailyPerformance({
    aderenciaDia,
}: DashboardDailyPerformanceProps) {

    // Processar aderência por dia - converter data em dia da semana
    const aderenciaDiaOrdenada = useMemo(() => {
        const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const mapaDias: Record<string, number> = {
            'Domingo': 7, 'Segunda': 1, 'Terça': 2, 'Terca': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Sabado': 6
        };

        return [...aderenciaDia]
            .map(dia => {
                // Se já tem dia_da_semana e dia_iso, usa eles
                if (dia.dia_da_semana && dia.dia_iso) return dia;

                // Se tem dia_da_semana mas não dia_iso, tenta mapear
                if (dia.dia_da_semana && !dia.dia_iso) {
                    return {
                        ...dia,
                        dia_iso: mapaDias[dia.dia_da_semana] || 0
                    };
                }

                // Se tem data, calcula
                if (dia.data) {
                    const dataObj = new Date(dia.data + 'T00:00:00');
                    if (!isNaN(dataObj.getTime())) {
                        const diaDaSemana = diasDaSemana[dataObj.getDay()];
                        const diaIso = dataObj.getDay() === 0 ? 7 : dataObj.getDay(); // ISO: 1=Segunda, 7=Domingo

                        return {
                            ...dia,
                            dia_da_semana: diaDaSemana,
                            dia_iso: diaIso
                        };
                    }
                }

                return dia;
            })
            .filter(dia => dia.dia_da_semana) // Garante que temos pelo menos o nome do dia
            .sort((a, b) => (a.dia_iso || 0) - (b.dia_iso || 0));
    }, [aderenciaDia]);

    if (aderenciaDiaOrdenada.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-slate-500" />
                    Performance Diária
                </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {aderenciaDiaOrdenada.map((dia, index) => {
                    const aderencia = dia.aderencia_percentual || 0;
                    const isToday = new Date().getDay() === (index + 1) % 7;

                    const statusColor = aderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                        aderencia >= 70 ? 'text-blue-600 dark:text-blue-400' :
                            'text-rose-600 dark:text-rose-400';

                    const barColor = aderencia >= 90 ? 'bg-emerald-500' :
                        aderencia >= 70 ? 'bg-blue-500' :
                            'bg-rose-500';

                    return (
                        <Card
                            key={`dia-${index}`}
                            className={`border-none shadow-md hover:shadow-lg transition-all duration-300 ${isToday
                                ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-200 dark:ring-blue-800'
                                : 'bg-white dark:bg-slate-900'
                                }`}
                        >
                            <CardContent className="p-4 flex flex-col items-center justify-between h-full min-h-[140px]">
                                <div className="text-center w-full">
                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                        <div className={`p-1.5 rounded-lg ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {dia.dia_da_semana?.substring(0, 3) || '---'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`text-2xl font-bold font-mono tracking-tight ${statusColor}`}>
                                        {Math.round(aderencia)}%
                                    </div>
                                </div>

                                <div className="w-full space-y-2 mt-3">
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-1000`}
                                            style={{ width: `${Math.min(aderencia, 100)}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-end text-xs text-muted-foreground font-mono">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(dia.horas_entregues || '0')}</span>
                                        <span className="text-[10px] opacity-60">/ {formatarHorasParaHMS(dia.horas_a_entregar || '0')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );

                })}
            </div>
        </div>
    );
});
