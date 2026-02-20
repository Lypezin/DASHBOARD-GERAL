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
}

export const EntradaSaidaRow: React.FC<EntradaSaidaRowProps> = ({ item, isFirst }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasOrigins = item.retomada_origins && Object.keys(item.retomada_origins).length > 0;
    const sortedOrigins = hasOrigins ? Object.entries(item.retomada_origins!).sort((a, b) => b[0].localeCompare(a[0])) : [];
    const totalRetomada = item.retomada_total || 0;

    const entradas_ops = (item.entradas_total || 0) - (item.entradas_marketing || 0);
    const saidas_ops = (item.saidas_total || 0) - (item.saidas_marketing || 0);
    const retomada_ops = totalRetomada - (item.retomada_marketing || 0);

    return (
        <motion.div layout className={`group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900/30 ${isFirst ? 'shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/20' : 'shadow-sm'}`}>
            <div className="p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 cursor-pointer relative z-10" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3 min-w-[140px]">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${isFirst ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500'}`}>
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-600 transition-colors">
                        {formatWeekLabel(item.semana)}
                    </h4>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-6 px-4 border-l border-r border-slate-100 dark:border-slate-800/50">
                    <EntradaSaidaRowStat label="Entradas" value={item.entradas_total || item.entradas} color={ENTRADA_SAIDA_COLORS.entradas} icon={ArrowUpRight} />
                    <div className="relative">
                        {hasOrigins ? (
                            <EntradaSaidaRetomadaDialog item={item} totalRetomada={totalRetomada} sortedOrigins={sortedOrigins} />
                        ) : (
                            <EntradaSaidaRowStat label="Retomada" value={totalRetomada} color={ENTRADA_SAIDA_COLORS.retomada} icon={RotateCcw} />
                        )}
                    </div>
                    <div className="relative">
                        <EntradaSaidaRowStat label="Saídas" value={item.saidas_total || item.saidas} color={ENTRADA_SAIDA_COLORS.saidas} icon={ArrowDownRight} />
                        {item.saidas_novos > 0 && <div className="absolute -top-1 -right-2 flex items-center justify-center h-5 w-5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold border-2 border-white dark:border-slate-900 shadow-sm" title={`${item.saidas_novos} desistências`}>!</div>}
                    </div>
                </div>
                <div className="flex items-center gap-3 min-w-[220px] justify-end">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Saldo</span>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${item.saldo >= 0 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                            {item.saldo >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span className="text-sm font-bold tabular-nums">{item.saldo > 0 ? '+' : ''}{item.saldo}</span>
                        </div>
                    </div>
                    {item.base_ativa > 0 && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Base Ativa</span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                                <span className="text-sm font-bold tabular-nums text-cyan-700 dark:text-cyan-300">{item.base_ativa.toLocaleString('pt-BR')}</span>
                                {item.variacao_base !== 0 && (
                                    <span className={`text-[10px] font-bold tabular-nums ${item.variacao_base > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.variacao_base > 0 ? '▲' : '▼'}{Math.abs(item.variacao_base)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-slate-100' : ''}`}>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && <EntradaSaidaExpanded item={item} totalRetomada={totalRetomada} entradas_ops={entradas_ops} saidas_ops={saidas_ops} retomada_ops={retomada_ops} />}
            </AnimatePresence>
        </motion.div>
    );
};
