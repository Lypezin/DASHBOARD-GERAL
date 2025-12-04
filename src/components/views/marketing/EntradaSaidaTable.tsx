import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ArrowDownRight, ArrowUpRight, Calendar, Eye, List } from 'lucide-react';

interface FluxoEntregadores {
    semana: string;
    entradas: number;
    saidas: number;
    saldo: number;
    nomes_entradas: string[];
    nomes_saidas: string[];
}

interface EntradaSaidaTableProps {
    data: FluxoEntregadores[];
}

export function EntradaSaidaTable({ data }: EntradaSaidaTableProps) {
    const sortedData = [...data].sort((a, b) => b.semana.localeCompare(a.semana));

    const formatWeekLabel = (semana: string) => {
        const match = semana.match(/^(\d{4})-W(\d+)$/);
        if (match) {
            return `Semana ${match[2]}`;
        }
        return semana.replace(/^(\d{2})(\d{2})-W(\d+)$/, 'Semana $3');
    };

    const getWeekYear = (semana: string) => {
        const match = semana.match(/^(\d{4})-W/);
        return match ? match[1] : '';
    };

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <List className="h-5 w-5 text-indigo-500" />
                            Histórico Detalhado
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Visualize e explore os dados semana a semana
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {data.length} semanas
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0 bg-white dark:bg-slate-900">
                {/* Header da tabela */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</div>
                    <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Entradas</div>
                    <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Saídas</div>
                    <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Resultado</div>
                </div>

                {/* Linhas */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedData.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Calendar className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para o período selecionado.</p>
                        </div>
                    ) : (
                        sortedData.map((item, index) => (
                            <div
                                key={item.semana}
                                className={`group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${index === 0 ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                                    }`}
                            >
                                {/* Período */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${index === 0
                                            ? 'bg-indigo-100 dark:bg-indigo-900/40'
                                            : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                                        }`}>
                                        <Calendar className={`h-5 w-5 ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${index === 0 ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-100'
                                            }`}>
                                            {formatWeekLabel(item.semana)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {getWeekYear(item.semana)}
                                        </p>
                                    </div>
                                    {index === 0 && (
                                        <Badge className="ml-2 bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] px-1.5">
                                            Mais recente
                                        </Badge>
                                    )}
                                </div>

                                {/* Entradas */}
                                <div className="col-span-3 flex flex-col items-start md:items-center justify-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="md:hidden text-sm text-slate-500">Entradas:</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                +{item.entradas}
                                            </span>
                                        </div>
                                    </div>

                                    {item.entradas > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 px-2 gap-1"
                                                >
                                                    <Eye className="h-3.5 w-3.5" /> Ver lista
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
                                                    <ul className="space-y-2">
                                                        {item.nomes_entradas.map((nome, idx) => (
                                                            <li key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                                                                <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                                                <span className="truncate">{nome}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Saídas */}
                                <div className="col-span-3 flex flex-col items-start md:items-center justify-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="md:hidden text-sm text-slate-500">Saídas:</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                                            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                -{item.saidas}
                                            </span>
                                        </div>
                                    </div>

                                    {item.saidas > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 px-2 gap-1"
                                                >
                                                    <Eye className="h-3.5 w-3.5" /> Ver lista
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
                                                    <ul className="space-y-2">
                                                        {item.nomes_saidas.map((nome, idx) => (
                                                            <li key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                                                                <div className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                                                                <span className="truncate">{nome}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Resultado */}
                                <div className="col-span-3 flex md:justify-end items-center gap-2">
                                    <span className="md:hidden text-sm text-slate-500">Resultado:</span>
                                    <Badge
                                        className={`text-sm font-semibold px-3 py-1 border-0 tabular-nums ${item.saldo >= 0
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}
                                    >
                                        {item.saldo > 0 ? '+' : ''}{item.saldo}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
