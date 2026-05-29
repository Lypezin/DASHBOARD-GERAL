import React, { useState } from 'react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { ArrowUpRight, ArrowDownRight, RotateCcw, ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeeklyData } from './EntradaSaidaCard';
import { EntradaSaidaRowStat, ENTRADA_SAIDA_COLORS } from './EntradaSaidaRowStat';
import { EntradaSaidaExpanded } from './EntradaSaidaExpanded';
import { EntradaSaidaRetomadaDialog } from './EntradaSaidaRetomadaDialog';

interface EntradaSaidaRowProps {
    item: WeeklyData;
    isFirst: boolean;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaRow: React.FC<EntradaSaidaRowProps> = ({ item, isFirst, organizationId, praca }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const retomadaOrigins = item.retomada_origins || {};
    const hasOrigins = Object.keys(retomadaOrigins).length > 0;
    const sortedOrigins = hasOrigins ? Object.entries(retomadaOrigins).sort((a, b) => b[0].localeCompare(a[0])) : [];
    const totalRetomada = item.retomada_total || 0;

    const entradasOps = (item.entradas_total || 0) - (item.entradas_marketing || 0);
    const saidasOps = (item.saidas_total || 0) - (item.saidas_marketing || 0);
    const retomadaOps = totalRetomada - (item.retomada_marketing || 0);

    return (
        <motion.div className={`group relative rounded-2xl border bg-white transition-all duration-300 hover:shadow-lg dark:bg-slate-900 ${isFirst ? 'border-sky-100 shadow-md ring-1 ring-sky-50 dark:border-sky-900/40 dark:ring-sky-900/20' : 'border-slate-100 shadow-sm hover:border-sky-100 dark:border-slate-800 dark:hover:border-sky-900/30'}`}>
            <div
                className="relative z-10 flex cursor-pointer flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex w-full items-center justify-center gap-3 sm:min-w-[140px] sm:w-auto sm:justify-start">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300 ${isFirst ? 'bg-sky-600 text-white shadow-lg shadow-sky-200 dark:shadow-sky-900/50' : 'bg-slate-50 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 dark:bg-slate-800 dark:text-slate-500'}`}>
                        <Calendar className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold leading-tight text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-100">
                        {formatWeekLabel(item.semana)}
                    </h4>
                </div>

                <div className="grid w-full min-w-0 grid-cols-3 gap-3 rounded-2xl border border-slate-100 px-3 py-3 dark:border-slate-800/70 sm:flex-1 sm:gap-6 sm:border-0 sm:border-l sm:border-r sm:px-4 sm:py-1">
                    <EntradaSaidaRowStat
                        label="Entradas"
                        value={item.entradas_total || item.entradas}
                        color={ENTRADA_SAIDA_COLORS.entradas}
                        icon={ArrowUpRight}
                    />

                    <div className="relative">
                        {hasOrigins ? (
                            <EntradaSaidaRetomadaDialog item={item} totalRetomada={totalRetomada} sortedOrigins={sortedOrigins} />
                        ) : (
                            <EntradaSaidaRowStat
                                label="Retomada"
                                value={totalRetomada}
                                color={ENTRADA_SAIDA_COLORS.retomada}
                                icon={RotateCcw}
                            />
                        )}
                    </div>

                    <div className="relative">
                        <EntradaSaidaRowStat
                            label="Saidas"
                            value={item.saidas_total || item.saidas}
                            color={ENTRADA_SAIDA_COLORS.saidas}
                            icon={ArrowDownRight}
                        />
                        {item.saidas_novos > 0 ? (
                            <div
                                className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-[10px] font-bold text-amber-600 shadow-sm dark:border-slate-900"
                                title={`${item.saidas_novos} desistencias`}
                            >
                                !
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:min-w-[220px] sm:w-auto sm:flex-nowrap sm:justify-end">
                    <div className="flex flex-col items-center">
                        <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Saldo</span>
                        <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 ${item.saldo >= 0 ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                            {item.saldo >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            <span className="text-sm font-bold tabular-nums">{item.saldo > 0 ? '+' : ''}{item.saldo}</span>
                        </div>
                    </div>

                    {item.base_ativa > 0 ? (
                        <div className="flex flex-col items-center">
                            <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Ativa</span>
                            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50 px-2.5 py-1 dark:bg-cyan-900/20">
                                <span className="text-sm font-bold tabular-nums text-cyan-700 dark:text-cyan-300">{item.base_ativa.toLocaleString('pt-BR')}</span>
                                {item.variacao_base !== 0 ? (
                                    <span className={`text-[10px] font-bold tabular-nums ${item.variacao_base > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.variacao_base > 0 ? '+' : '-'}{Math.abs(item.variacao_base)}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 transition-all duration-300 dark:bg-slate-800 ${isExpanded ? 'rotate-180 bg-slate-100' : ''}`}>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded ? (
                    <EntradaSaidaExpanded
                        item={item}
                        totalRetomada={totalRetomada}
                        entradas_ops={entradasOps}
                        saidas_ops={saidasOps}
                        retomada_ops={retomadaOps}
                        organizationId={organizationId}
                        praca={praca}
                    />
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};
