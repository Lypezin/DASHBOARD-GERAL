import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Calendar, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntradaSaidaWeeklyGridProps {
    data: any[];
}

export const EntradaSaidaWeeklyGrid: React.FC<EntradaSaidaWeeklyGridProps> = ({ data }) => {
    // Ordenar dados por semana (mais recente primeiro)
    const sortedWeeklyData = useMemo(() => {
        return [...data].sort((a, b) => b.semana.localeCompare(a.semana));
    }, [data]);

    const formatWeekLabel = (semana: string) => {
        const match = semana.match(/^(\d{4})-W(\d+)$/);
        if (match) {
            return `Semana ${match[2]}`;
        }
        return semana.replace(/^(\d{2})(\d{2})-W(\d+)$/, 'Semana $3');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Detalhamento por Semana
                </h3>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {data.length} semanas
                </Badge>
            </div>

            {sortedWeeklyData.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Calendar className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para o período selecionado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedWeeklyData.map((item, index) => (
                        <div
                            key={item.semana}
                            className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${index === 0
                                ? 'border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-100 dark:shadow-none'
                                : 'border-slate-200 dark:border-slate-800 shadow-sm'
                                }`}
                        >
                            {index === 0 && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            )}

                            {/* Header do Card */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${index === 0
                                        ? 'bg-indigo-100 dark:bg-indigo-900/40'
                                        : 'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                        <Calendar className={`h-4 w-4 ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm ${index === 0 ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-100'
                                            }`}>
                                            {formatWeekLabel(item.semana)}
                                        </p>
                                    </div>
                                </div>
                                {index === 0 && (
                                    <Badge className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] px-2">
                                        Atual
                                    </Badge>
                                )}
                            </div>

                            {/* Métricas */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {/* Entradas */}
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 pt-2">
                                    <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600/70 dark:text-emerald-400/70 mb-2 text-center">Entradas</p>

                                    <div className="space-y-1 mb-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-emerald-700/70 dark:text-emerald-400/70 flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                Mkt
                                            </span>
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">+{item.entradas_marketing || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-emerald-700/70 dark:text-emerald-400/70 flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-300"></div>
                                                Operacional
                                            </span>
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                                +{Math.max(0, (item.entradas_total || item.entradas) - (item.entradas_marketing || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-emerald-200/50 dark:border-emerald-800/30 pt-1.5">
                                        <span className="text-[10px] font-bold uppercase text-emerald-800/60 dark:text-emerald-300/60">Total</span>
                                        <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">+{item.entradas_total || item.entradas}</span>
                                    </div>
                                </div>

                                {/* Saídas */}
                                <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 pt-2">
                                    <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-600/70 dark:text-rose-400/70 mb-2 text-center">Saídas</p>

                                    <div className="space-y-1 mb-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-rose-700/70 dark:text-rose-400/70 flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                                Mkt
                                            </span>
                                            <span className="font-semibold text-rose-700 dark:text-rose-400 tabular-nums">-{item.saidas_marketing || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-rose-700/70 dark:text-rose-400/70 flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-300"></div>
                                                Operacional
                                            </span>
                                            <span className="font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                                                -{Math.max(0, (item.saidas_total || item.saidas) - (item.saidas_marketing || 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-rose-200/50 dark:border-rose-800/30 pt-1.5">
                                        <span className="text-[10px] font-bold uppercase text-rose-800/60 dark:text-rose-300/60">Total</span>
                                        <span className="text-base font-bold text-rose-700 dark:text-rose-400 tabular-nums">-{item.saidas_total || item.saidas}</span>
                                    </div>
                                </div>
                            </div>

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
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                                        <ArrowUpRight className="h-5 w-5" />
                                                        Entradas - {formatWeekLabel(item.semana)}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        {item.entradas} novos entregadores ativos nesta semana.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                                                    <div className="space-y-4">
                                                        {(!item.nomes_entradas_marketing?.length && !item.nomes_entradas_operacional?.length) && (
                                                            <div className="text-sm text-slate-500 text-center py-4">Nenhum registro.</div>
                                                        )}

                                                        {item.nomes_entradas_marketing?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                                    Marketing ({item.nomes_entradas_marketing.length})
                                                                </h4>
                                                                <ul className="space-y-1.5">
                                                                    {item.nomes_entradas_marketing.map((nome: string, idx: number) => (
                                                                        <li key={`mkt-${idx}`} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                                                                            <span className="truncate">{nome}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {item.nomes_entradas_operacional?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-300"></div>
                                                                    Operacional ({item.nomes_entradas_operacional.length})
                                                                </h4>
                                                                <ul className="space-y-1.5">
                                                                    {item.nomes_entradas_operacional.map((nome: string, idx: number) => (
                                                                        <li key={`ops-${idx}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-1.5 px-3 rounded-md bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                                                            <span className="truncate">{nome}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {item.saidas > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-rose-600">
                                                        <ArrowDownRight className="h-5 w-5" />
                                                        Saídas - {formatWeekLabel(item.semana)}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        {item.saidas} entregadores ficaram inativos nesta semana.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                                                    <div className="space-y-4">
                                                        {(!item.nomes_saidas_marketing?.length && !item.nomes_saidas_operacional?.length) && (
                                                            <div className="text-sm text-slate-500 text-center py-4">Nenhum registro.</div>
                                                        )}

                                                        {item.nomes_saidas_marketing?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                                                    Marketing ({item.nomes_saidas_marketing.length})
                                                                </h4>
                                                                <ul className="space-y-1.5">
                                                                    {item.nomes_saidas_marketing.map((nome: string, idx: number) => (
                                                                        <li key={`mkt-out-${idx}`} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-rose-100 dark:border-rose-900/30">
                                                                            <span className="truncate">{nome}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {item.nomes_saidas_operacional?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-300"></div>
                                                                    Operacional ({item.nomes_saidas_operacional.length})
                                                                </h4>
                                                                <ul className="space-y-1.5">
                                                                    {item.nomes_saidas_operacional.map((nome: string, idx: number) => (
                                                                        <li key={`ops-out-${idx}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-1.5 px-3 rounded-md bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                                                            <span className="truncate">{nome}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
