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
            className={`group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 ${isFirst ? 'shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/20' : 'shadow-sm'}`}
        >
            {isFirst && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />}

            <div
                className="p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Week & Date */}
                <div className="flex items-center gap-4 min-w-[140px]">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isFirst ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                            {formatWeekLabel(item.semana)}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                            {item.semana}
                        </span>
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="flex-1 grid grid-cols-3 gap-4 border-l border-r border-slate-100 dark:border-slate-800 px-6 mx-2">
                    <Stat label="Entradas" value={item.entradas_total || item.entradas} color={colors.entradas} icon={ArrowUpRight} />
                    <Stat label="Retomada" value={item.retomada_total || 0} color={colors.retomada} icon={RotateCcw} />
                    <Stat label="Saídas" value={item.saidas_total || item.saidas} color={colors.saidas} icon={ArrowDownRight} />
                </div>

                {/* Balance & Actions */}
                <div className="flex items-center gap-4 min-w-[120px] justify-end">
                    {/* Desistencias Alert */}
                    {item.saidas_novos > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/30" title={`${item.saidas_novos} desistências (novos)`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">-{item.saidas_novos}</span>
                        </div>
                    )}

                    <div className={`flex flex-col items-end px-3 py-1 rounded-lg ${item.saldo >= 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                        <span className="text-[10px] font-bold uppercase opacity-70">Saldo</span>
                        <span className="text-lg font-bold tabular-nums">{item.saldo > 0 ? '+' : ''}{item.saldo}</span>
                    </div>

                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-slate-400" />
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
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                            {/* Detailed Lists or Actions */}
                            <div className="flex justify-center gap-4">
                                <span className="text-xs font-medium text-slate-500">Ver Listas:</span>
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

                            {/* Breakdown Stats (Mkt vs Ops) could go here if needed, keeping it simple for now */}
                            <div className="col-span-2 flex justify-end gap-6 text-xs text-slate-500">
                                <div><span className="font-semibold">Entradas:</span> Mkt {item.entradas_marketing} | Ops {item.entradas_total ? item.entradas_total - (item.entradas_marketing || 0) : 0}</div>
                                <div><span className="font-semibold">Retomada:</span> Mkt {item.retomada_marketing} | Ops {(item.retomada_total || 0) - (item.retomada_marketing || 0)}</div>
                                <div><span className="font-semibold">Saídas:</span> Mkt {item.saidas_marketing} | Ops {item.saidas_total ? item.saidas_total - (item.saidas_marketing || 0) : 0}</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
