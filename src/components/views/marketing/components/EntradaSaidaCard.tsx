import React from 'react';
import { MetricBlock } from './MetricBlock';
import { EntradaSaidaHeader } from './EntradaSaidaHeader';
import { EntradaSaidaFooter } from './EntradaSaidaFooter';

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
    retomada_total: number;
    retomada_marketing?: number;
    nomes_retomada_marketing: string[];
    nomes_retomada_operacional: string[];
    retomada_origins?: Record<string, number>;
    base_ativa: number;
    variacao_base: number;
}

interface EntradaSaidaCardProps {
    item: WeeklyData;
    isFirst: boolean;
}

export const EntradaSaidaCard: React.FC<EntradaSaidaCardProps> = ({ item, isFirst }) => {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isFirst
                ? 'border-sky-100 bg-gradient-to-br from-sky-50 to-white shadow-md ring-1 ring-sky-100 dark:border-sky-900/40 dark:from-sky-950/20 dark:to-slate-900 dark:ring-sky-900/30'
                : 'border-slate-100 bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900'
                }`}
        >
            {isFirst ? (
                <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500"></div>
            ) : null}

            <EntradaSaidaHeader semana={item.semana} isFirst={isFirst} />

            <div className="mb-4 grid grid-cols-3 gap-2">
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

            {item.saidas_novos > 0 ? (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 p-2 dark:border-amber-900/30 dark:bg-amber-900/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-amber-600/80 dark:text-amber-400/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Desistências (novos)
                    </div>
                    <span className="tabular-nums text-xs font-bold text-amber-700 dark:text-amber-400">
                        -{item.saidas_novos}
                    </span>
                </div>
            ) : null}

            <EntradaSaidaFooter item={item} />
        </div>
    );
};
