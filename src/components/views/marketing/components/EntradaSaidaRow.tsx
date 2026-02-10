import React, { useState } from 'react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { MetricDetailDialog } from './MetricDetailDialog';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, RotateCcw, ChevronDown, ChevronUp, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeeklyData } from './EntradaSaidaCard';

interface EntradaSaidaRowProps {
    item: WeeklyData;
    isFirst: boolean;
}

export const EntradaSaidaRow: React.FC<EntradaSaidaRowProps> = ({ item, isFirst }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper to render mini-stat
    const Stat = ({ label, value, color, icon: Icon }: any) => (
        <div className="flex flex-col items-center justify-center min-w-[80px]">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${color.textLight} mb-0.5`}>{label}</span>
            <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded-full ${color.bg}`}>
                    <Icon className={`w-3 h-3 ${color.icon}`} />
                </div>
                <span className={`text-lg font-bold ${color.text} tabular-nums`}>{value}</span>
            </div>
        </div>
    );

    const colors = {
        entradas: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300', textLight: 'text-emerald-600/70' },
        retomada: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-300', textLight: 'text-indigo-600/70' },
        saidas: { bg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', text: 'text-rose-700 dark:text-rose-300', textLight: 'text-rose-600/70' },
    };

    return (
        <motion.div
            layout
            className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900/30 ${isFirst ? 'shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/20' : 'shadow-sm'}`}
        >
            <div
                className="p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 cursor-pointer relative z-10"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Week & Date */}
                <div className="flex items-center gap-4 min-w-[150px]">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isFirst ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500'}`}>
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-600 transition-colors">
                            {formatWeekLabel(item.semana)}
                        </h4>
                        {/* Label removed as per user request */}
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="flex-1 grid grid-cols-3 gap-8 px-4 border-l border-r border-slate-100 dark:border-slate-800/50">
                    <Stat label="Entradas" value={item.entradas_total || item.entradas} color={colors.entradas} icon={ArrowUpRight} />
                    <Stat label="Retomada" value={item.retomada_total || 0} color={colors.retomada} icon={RotateCcw} />
                    <div className="relative">
                        <Stat label="Saídas" value={item.saidas_total || item.saidas} color={colors.saidas} icon={ArrowDownRight} />
                        {item.saidas_novos > 0 && (
                            <div className="absolute -top-1 -right-2 flex items-center justify-center h-5 w-5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold border border-white dark:border-slate-900 shadow-sm" title={`${item.saidas_novos} desistências`}>!</div>
                        )}
                    </div>
                </div>

                {/* Balance & Actions */}
                <div className="flex items-center gap-6 min-w-[140px] justify-end">
                    <div className={`flex flex-col items-end`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Saldo</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${item.saldo >= 0 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20'}`}>
                            {item.saldo >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            <span className="text-lg font-bold tabular-nums">{Math.abs(item.saldo)}</span>
                        </div>
                    </div>

                    <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-slate-100' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            {/* Detailed Lists Actions */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Listas Detalhadas</h5>
                                <div className="flex flex-wrap gap-3">
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
                                    {(item.saidas > 0) && (
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

                            {/* Breakdown Stats */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Composição (Mkt / Ops)</h5>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-[10px] text-emerald-600 font-bold block mb-1">Entradas</span>
                                        <div className="text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                            Mkt: <b>{item.entradas_marketing}</b><br />Ops: <b>{item.entradas_total ? item.entradas_total - (item.entradas_marketing || 0) : 0}</b>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-indigo-600 font-bold block mb-1">Retomada</span>
                                        <div className="text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                            Mkt: <b>{item.retomada_marketing}</b><br />Ops: <b>{(item.retomada_total || 0) - (item.retomada_marketing || 0)}</b>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-rose-600 font-bold block mb-1">Saídas</span>
                                        <div className="text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                            Mkt: <b>{item.saidas_marketing}</b><br />Ops: <b>{item.saidas_total ? item.saidas_total - (item.saidas_marketing || 0) : 0}</b>
                                        </div>
                                    </div>
                                </div>
                                {item.saidas_novos > 0 && (
                                    <div className="mt-2 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                                        ⚠️ <b>{item.saidas_novos}</b> saíram antes de 30 corridas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
