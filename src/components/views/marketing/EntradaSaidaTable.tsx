import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowDownRight, ArrowUpRight, Calendar, Users, Eye } from 'lucide-react';

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
    // Ordenar por semana decrescente (mais recente primeiro)
    const sortedData = [...data].sort((a, b) => b.semana.localeCompare(a.semana));

    const formatWeekLabel = (semana: string) => {
        return semana.replace(/^(\d{2})(\d{2})-W(\d+)$/, 'Semana $3/$2');
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Detalhamento Semanal
                    </CardTitle>
                    <Badge variant="outline" className="text-slate-500">
                        {data.length} registros
                    </Badge>
                </div>

                {/* Cabeçalho da Tabela (Visual) */}
                <div className="hidden md:grid grid-cols-12 gap-4 mt-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Semana</div>
                    <div className="col-span-3 text-center">Entradas (Novos)</div>
                    <div className="col-span-3 text-center">Saídas (Churn)</div>
                    <div className="col-span-3 text-right">Saldo Líquido</div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {sortedData.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        Nenhum dado encontrado para o período selecionado.
                    </div>
                ) : (
                    sortedData.map((item) => (
                        <div
                            key={item.semana}
                            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 transition-all hover:shadow-md hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                {/* Coluna Semana */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                                        <Calendar className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                            {formatWeekLabel(item.semana)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {item.semana}
                                        </p>
                                    </div>
                                </div>

                                {/* Coluna Entradas */}
                                <div className="col-span-3 flex flex-col md:items-center justify-center">
                                    <div className="flex items-center gap-2 mb-1 md:mb-0">
                                        <span className="md:hidden text-sm text-slate-500">Entradas:</span>
                                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                            +{item.entradas}
                                        </span>
                                    </div>

                                    {item.entradas > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 px-2"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" /> Ver nomes
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                                        <ArrowUpRight className="h-5 w-5" />
                                                        Entradas - {formatWeekLabel(item.semana)}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Lista de {item.entradas} novos entregadores ativos nesta semana.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-slate-50 dark:bg-slate-900">
                                                    <ul className="space-y-2">
                                                        {item.nomes_entradas.map((nome, idx) => (
                                                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                                {nome}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Coluna Saídas */}
                                <div className="col-span-3 flex flex-col md:items-center justify-center">
                                    <div className="flex items-center gap-2 mb-1 md:mb-0">
                                        <span className="md:hidden text-sm text-slate-500">Saídas:</span>
                                        <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                            -{item.saidas}
                                        </span>
                                    </div>

                                    {item.saidas > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 px-2"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" /> Ver nomes
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-rose-600">
                                                        <ArrowDownRight className="h-5 w-5" />
                                                        Saídas - {formatWeekLabel(item.semana)}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Lista de {item.saidas} entregadores inativos (churn) nesta semana.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-slate-50 dark:bg-slate-900">
                                                    <ul className="space-y-2">
                                                        {item.nomes_saidas.map((nome, idx) => (
                                                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                                                {nome}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Coluna Saldo */}
                                <div className="col-span-3 flex md:justify-end items-center gap-2">
                                    <span className="md:hidden text-sm text-slate-500">Saldo:</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-base px-3 py-1 ${item.saldo >= 0
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                                : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                                            }`}
                                    >
                                        {item.saldo > 0 ? '+' : ''}{item.saldo}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
