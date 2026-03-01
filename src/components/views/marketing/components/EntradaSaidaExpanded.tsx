import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, RotateCcw, Megaphone, Wrench, UserX, Eye } from 'lucide-react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { MetricDetailDialog } from './MetricDetailDialog';
import { WeeklyData } from './EntradaSaidaCard';

interface Props {
    item: WeeklyData; totalRetomada: number; entradas_ops: number; saidas_ops: number; retomada_ops: number;
}

const MetricBox = ({ icon: Icon, title, value, mkt, ops, borderClass, textClass, colorClass }: any) => (
    <div className={`bg-white dark:bg-slate-800/80 rounded-xl border p-3 text-center ${borderClass}`}>
        <div className="flex items-center justify-center gap-1.5 mb-2"><Icon className={`w-3.5 h-3.5 ${textClass}`} /><span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>{title}</span></div>
        <div className={`text-xl font-bold tabular-nums mb-1 ${colorClass}`}>{value}</div>
        <div className="flex items-center justify-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-500"><Megaphone className="w-3 h-3 text-blue-400" /><b className="text-slate-700 dark:text-slate-200">{mkt}</b></span>
            <span className="flex items-center gap-1 text-slate-500"><Wrench className="w-3 h-3 text-slate-400" /><b className="text-slate-700 dark:text-slate-200">{ops}</b></span>
        </div>
    </div>
);

export const EntradaSaidaExpanded: React.FC<Props> = ({ item, totalRetomada, entradas_ops, saidas_ops, retomada_ops }) => {
    return (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
            <div className="border-t border-slate-100 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-800/30 dark:to-slate-900">
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-4 gap-3">
                        <MetricBox icon={ArrowUpRight} title="Entradas" value={item.entradas_total || item.entradas} mkt={item.entradas_marketing || 0} ops={entradas_ops} borderClass="border-emerald-100 dark:border-emerald-900/30" textClass="text-emerald-600" colorClass="text-emerald-700 dark:text-emerald-300" />
                        <MetricBox icon={RotateCcw} title="Retomada" value={totalRetomada} mkt={item.retomada_marketing || 0} ops={retomada_ops} borderClass="border-indigo-100 dark:border-indigo-900/30" textClass="text-indigo-600" colorClass="text-indigo-700 dark:text-indigo-300" />
                        <MetricBox icon={ArrowDownRight} title="Saídas" value={item.saidas_total || item.saidas} mkt={item.saidas_marketing || 0} ops={saidas_ops} borderClass="border-rose-100 dark:border-rose-900/30" textClass="text-rose-600" colorClass="text-rose-700 dark:text-rose-300" />

                        <div className={`bg-white dark:bg-slate-800/80 rounded-xl border p-3 text-center ${(item.saidas_novos || 0) > 0 ? 'border-amber-200 dark:border-amber-900/30' : 'border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex items-center justify-center gap-1.5 mb-2"><UserX className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Desistências</span></div>
                            <div className={`text-xl font-bold tabular-nums mb-1 ${(item.saidas_novos || 0) > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400'}`}>{item.saidas_novos || 0}</div>
                            {(item.saidas_novos || 0) > 0 && ((item.saidas_total || 0) > 0 || (item.saidas || 0) > 0) && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{Math.round(((item.saidas_novos || 0) / (item.saidas_total || item.saidas || 1)) * 100)}% das saídas</div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1"><Eye className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />Ver nomes:</span>
                        {(item.entradas > 0 || (item.entradas_total || 0) > 0) && (
                            <MetricDetailDialog type="entradas" weekLabel={formatWeekLabel(item.semana)} count={item.entradas_total || item.entradas} marketingNames={item.nomes_entradas_marketing || []} operacionalNames={item.nomes_entradas_operacional || []} />
                        )}
                        {(item.retomada_total || 0) > 0 && (
                            <MetricDetailDialog type="retomada" weekLabel={formatWeekLabel(item.semana)} count={item.retomada_total || 0} marketingNames={item.nomes_retomada_marketing || []} operacionalNames={item.nomes_retomada_operacional || []} />
                        )}
                        {(item.saidas > 0 || (item.saidas_total || 0) > 0) && (
                            <MetricDetailDialog type="saidas" weekLabel={formatWeekLabel(item.semana)} count={item.saidas_total || item.saidas} marketingNames={item.nomes_saidas_marketing || []} operacionalNames={item.nomes_saidas_operacional || []} marketingNovosNames={item.nomes_saidas_novos_marketing || []} operacionalNovosNames={item.nomes_saidas_novos_operacional || []} />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
