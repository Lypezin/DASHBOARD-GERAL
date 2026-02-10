import React, { useState } from 'react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { MetricDetailDialog } from './MetricDetailDialog';
import { ArrowUpRight, ArrowDownRight, RotateCcw, ChevronDown, AlertCircle, Calendar, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeeklyData } from './EntradaSaidaCard';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntradaSaidaRowProps {
    item: WeeklyData;
    isFirst: boolean;
}

export const EntradaSaidaRow: React.FC<EntradaSaidaRowProps> = ({ item, isFirst }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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

    const hasOrigins = item.retomada_origins && Object.keys(item.retomada_origins).length > 0;
    const sortedOrigins = hasOrigins
        ? Object.entries(item.retomada_origins!).sort((a, b) => b[0].localeCompare(a[0]))
        : [];
    const totalRetomada = item.retomada_total || 0;

    return (
        <motion.div
            layout
            className={`group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900/30 ${isFirst ? 'shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/20' : 'shadow-sm'}`}
        >
            <div
                className="p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 cursor-pointer relative z-10"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Week & Date */}
                <div className="flex items-center gap-3 min-w-[140px]">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${isFirst ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-500'}`}>
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-600 transition-colors">
                        {formatWeekLabel(item.semana)}
                    </h4>
                </div>

                {/* Metrics Row */}
                <div className="flex-1 grid grid-cols-3 gap-6 px-4 border-l border-r border-slate-100 dark:border-slate-800/50">
                    <Stat label="Entradas" value={item.entradas_total || item.entradas} color={colors.entradas} icon={ArrowUpRight} />

                    {/* Retomada with clickable origins */}
                    <div className="relative">
                        <Stat label="Retomada" value={totalRetomada} color={colors.retomada} icon={RotateCcw} />
                        {hasOrigins && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button
                                        className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-bold border-2 border-white dark:border-slate-900 shadow-sm hover:bg-indigo-200 hover:scale-110 transition-all cursor-pointer z-20"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Ver semanas de origem"
                                    >
                                        <Clock className="w-3 h-3" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[380px] p-0 gap-0 rounded-2xl">
                                    {/* Header */}
                                    <div className="p-5 pb-3">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-indigo-600 text-base">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                                    <RotateCcw className="h-4 w-4" />
                                                </div>
                                                Origem da Retomada
                                            </DialogTitle>
                                            <DialogDescription className="text-xs mt-1">
                                                {formatWeekLabel(item.semana)} — {totalRetomada} entregadores retornaram
                                            </DialogDescription>
                                        </DialogHeader>
                                    </div>

                                    {/* Scrollable list */}
                                    <ScrollArea className="max-h-[50vh] px-5">
                                        <div className="space-y-1.5 pb-3">
                                            {sortedOrigins.map(([week, count], idx) => {
                                                const percent = Math.round((Number(count) / totalRetomada) * 100);
                                                return (
                                                    <div key={week} className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-indigo-100/50 dark:bg-indigo-900/15 rounded-xl"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                        <div className="relative flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'}`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                                    {formatWeekLabel(week)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                                                                    {count}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
                                                                    {percent}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>

                                    {/* Footer */}
                                    <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Total: <b className="text-indigo-600 dark:text-indigo-400">{totalRetomada}</b> retornaram em {formatWeekLabel(item.semana)}
                                        </span>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="relative">
                        <Stat label="Saídas" value={item.saidas_total || item.saidas} color={colors.saidas} icon={ArrowDownRight} />
                        {item.saidas_novos > 0 && (
                            <div className="absolute -top-1 -right-2 flex items-center justify-center h-5 w-5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold border-2 border-white dark:border-slate-900 shadow-sm" title={`${item.saidas_novos} desistências`}>!</div>
                        )}
                    </div>
                </div>

                {/* Balance & Base Ativa */}
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

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            {/* Detailed Lists */}
                            <div className="space-y-2.5">
                                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Listas Detalhadas</h5>
                                <div className="flex flex-wrap gap-2">
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
                            <div className="space-y-2.5">
                                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Composição (Mkt / Ops)</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-[10px] text-emerald-600 font-bold block mb-1">Entradas</span>
                                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                                            <div>Mkt: <b>{item.entradas_marketing}</b></div>
                                            <div>Ops: <b>{item.entradas_total ? item.entradas_total - (item.entradas_marketing || 0) : 0}</b></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-[10px] text-indigo-600 font-bold block mb-1">Retomada</span>
                                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                                            <div>Mkt: <b>{item.retomada_marketing}</b></div>
                                            <div>Ops: <b>{(item.retomada_total || 0) - (item.retomada_marketing || 0)}</b></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-[10px] text-rose-600 font-bold block mb-1">Saídas</span>
                                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                                            <div>Mkt: <b>{item.saidas_marketing}</b></div>
                                            <div>Ops: <b>{item.saidas_total ? item.saidas_total - (item.saidas_marketing || 0) : 0}</b></div>
                                        </div>
                                    </div>
                                </div>
                                {item.saidas_novos > 0 && (
                                    <div className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30 inline-flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <b>{item.saidas_novos}</b> saíram antes de 30 corridas.
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
