import React from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { MetricBlock } from './MetricBlock';
import { MetricDetailDialog } from './MetricDetailDialog';

export interface WeeklyData {
    semana: string;
    entradas: number;
    entradas_marketing?: number;
    entradas_total?: number;
    saidas: number;
    saidas_marketing?: number;
    saidas_total?: number;
    saidas_novos: number;
    saldo: number;
    nomes_entradas_marketing?: string[];
    nomes_entradas_operacional?: string[];
    nomes_saidas_marketing?: string[];
    nomes_saidas_operacional?: string[];
    nomes_saidas_novos_marketing?: string[];
    nomes_saidas_novos_operacional?: string[];
}

interface EntradaSaidaCardProps {
    item: WeeklyData;
    isFirst: boolean;
}

export const EntradaSaidaCard: React.FC<EntradaSaidaCardProps> = ({ item, isFirst }) => {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isFirst
                ? 'border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-100 dark:shadow-none'
                : 'border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
        >
            {isFirst && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            )}

            {/* Header do Card */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isFirst
                        ? 'bg-indigo-100 dark:bg-indigo-900/40'
                        : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                        <Calendar className={`h-4 w-4 ${isFirst ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                            }`} />
                    </div>
                    <div>
                        <p className={`font-semibold text-sm ${isFirst ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-100'
                            }`}>
                            {formatWeekLabel(item.semana)}
                        </p>
                    </div>
                </div>
                {isFirst && (
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] px-2">
                        Atual
                    </Badge>
                )}
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricBlock
                    type="entradas"
                    marketing={item.entradas_marketing || 0}
                    total={item.entradas_total || item.entradas}
                />

                <MetricBlock
                    type="saidas"
                    marketing={item.saidas_marketing || 0}
                    total={item.saidas_total || item.saidas}
                />
            </div>

            {/* Novos - Desistências */}
            {item.saidas_novos > 0 && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-2 mb-4 flex items-center justify-between px-3 border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[10px] uppercase font-semibold text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                        Desistências (Novos)
                    </p>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                        -{item.saidas_novos}
                    </span>
                </div>
            )}

            {/* Saldo e Ações */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Badge
                    className={`text-sm font-semibold px-3 py-1 border-0 tabular-nums ${item.saldo >= 0
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                >
                    Saldo: {item.saldo > 0 ? '+' : ''}{item.saldo}
                </Badge>

                <div className="flex gap-1">
                    {item.entradas > 0 && (
                        <MetricDetailDialog
                            type="entradas"
                            weekLabel={formatWeekLabel(item.semana)}
                            count={item.entradas}
                            marketingNames={item.nomes_entradas_marketing}
                            operacionalNames={item.nomes_entradas_operacional}
                        />
                    )}

                    {(item.saidas > 0 || item.saidas_novos > 0) && (
                        <MetricDetailDialog
                            type="saidas"
                            weekLabel={formatWeekLabel(item.semana)}
                            count={item.saidas}
                            marketingNames={item.nomes_saidas_marketing}
                            operacionalNames={item.nomes_saidas_operacional}
                            marketingNovosNames={item.nomes_saidas_novos_marketing}
                            operacionalNovosNames={item.nomes_saidas_novos_operacional}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
