import React from 'react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { MetricBlock } from './MetricBlock';
import { MetricDetailDialog } from './MetricDetailDialog';
import { EntradaSaidaHeader } from './EntradaSaidaHeader';
import { Badge } from '@/components/ui/badge';

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
    // Retomada
    retomada_total?: number;
    retomada_marketing?: number;
    nomes_retomada_marketing?: string[];
    nomes_retomada_operacional?: string[];
}

interface EntradaSaidaCardProps {
    item: WeeklyData;
    isFirst: boolean;
}

export const EntradaSaidaCard: React.FC<EntradaSaidaCardProps> = ({ item, isFirst }) => {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border-none p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isFirst
                ? 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900'
                : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-900'
                }`}
        >
            {isFirst && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            )}

            {/* Header do Card */}
            <EntradaSaidaHeader semana={item.semana} isFirst={isFirst} />

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <MetricBlock
                    type="entradas"
                    marketing={item.entradas_marketing || 0}
                    total={item.entradas_total || item.entradas}
                />

                <MetricBlock
                    type="retomada"
                    marketing={item.retomada_marketing || 0}
                    total={item.retomada_total || 0}
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
                <Badge className={`text-sm font-semibold px-3 py-1 border-0 tabular-nums ${item.saldo >= 0
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
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

                    {(item.retomada_total || 0) > 0 && (
                        <MetricDetailDialog
                            type="retomada"
                            weekLabel={formatWeekLabel(item.semana)}
                            count={item.retomada_total || 0}
                            marketingNames={item.nomes_retomada_marketing}
                            operacionalNames={item.nomes_retomada_operacional}
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
