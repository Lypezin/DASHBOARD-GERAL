import React, { useMemo } from 'react';
import { useMarketingComparacao } from './useMarketingComparacao';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2, Clock, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DashboardFilters } from '@/types';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface MarketingComparacaoViewProps {
    filters: DashboardFilters;
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

function formatDuration(seconds: number): string {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Helper to get week number
function extractWeekNumber(isoWeek: string) {
    return isoWeek.split('-W')[1] || isoWeek;
}

// Helper to calculate percentage
function calculatePercentage(value: number, total: number) {
    if (!total || total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
}

// Helper to calculate date range from ISO week
function getDateRangeFromWeek(year: number, week: number) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const isoWeekStart = simple;
    if (dayOfWeek <= 4)
        isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());

    const isoWeekEnd = new Date(isoWeekStart);
    isoWeekEnd.setDate(isoWeekStart.getDate() + 6);

    return {
        start: isoWeekStart.toISOString().split('T')[0],
        end: isoWeekEnd.toISOString().split('T')[0]
    };
}

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { user } = useAuth();

    // Determine the date range
    let dataInicial = filters.dataInicial;
    let dataFinal = filters.dataFinal;

    // If dates are not set (e.g. Ano/Semana mode), calculate from week/year
    if (!dataInicial || !dataFinal) {
        if (filters.ano && filters.semana) {
            const range = getDateRangeFromWeek(filters.ano, filters.semana);
            dataInicial = range.start;
            dataFinal = range.end;
        } else if (filters.ano) {
            // Whole year if only year is selected (or default to current year jan 1 - dec 31)
            dataInicial = `${filters.ano}-01-01`;
            dataFinal = `${filters.ano}-12-31`;
        } else {
            // Fallback to current year
            const year = new Date().getFullYear();
            dataInicial = `${year}-01-01`;
            dataFinal = new Date().toISOString().split('T')[0];
        }
    }

    // Handle "Todas" or null praca
    const praca = (filters.praca && filters.praca !== 'Todas') ? filters.praca : null;

    console.log('MarketingComparacaoView Filter Debug:', {
        rawFilters: filters,
        calculated: {
            dataInicial,
            dataFinal,
            praca
        }
    });

    const { data, loading, error } = useMarketingComparacao(
        dataInicial,
        dataFinal,
        user?.organization_id || undefined,
        praca
    );

    // Calculate totals
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            segundos_ops: acc.segundos_ops + row.segundos_ops,
            segundos_mkt: acc.segundos_mkt + row.segundos_mkt,
            ofertadas_ops: acc.ofertadas_ops + row.ofertadas_ops,
            ofertadas_mkt: acc.ofertadas_mkt + row.ofertadas_mkt,
            aceitas_ops: acc.aceitas_ops + row.aceitas_ops,
            aceitas_mkt: acc.aceitas_mkt + row.aceitas_mkt,
            concluidas_ops: acc.concluidas_ops + row.concluidas_ops,
            concluidas_mkt: acc.concluidas_mkt + row.concluidas_mkt,
            rejeitadas_ops: acc.rejeitadas_ops + row.rejeitadas_ops,
            rejeitadas_mkt: acc.rejeitadas_mkt + row.rejeitadas_mkt,
        }), {
            segundos_ops: 0, segundos_mkt: 0,
            ofertadas_ops: 0, ofertadas_mkt: 0,
            aceitas_ops: 0, aceitas_mkt: 0,
            concluidas_ops: 0, concluidas_mkt: 0,
            rejeitadas_ops: 0, rejeitadas_mkt: 0
        });
    }, [data]);

    const totalHours = totals.segundos_ops + totals.segundos_mkt;

    // Filter out current week to match other tabs if needed, 
    // or keep it raw. User didn't specify, but usually we filter incomplete weeks.
    // For now, let's show all data returned by the RPC.

    return (
        <div className="space-y-6 pb-20">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Horas Totais
                                </CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatDuration(totalHours)}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                    <span className="flex items-center gap-1">Ops: <span className="font-mono">{formatDuration(totals.segundos_ops)}</span></span>
                                    <span className="text-purple-600 font-semibold flex items-center gap-1">Mkt: <span className="font-mono">{formatDuration(totals.segundos_mkt)}</span></span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Corridas Ofertadas
                                </CardTitle>
                                <Send className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{(totals.ofertadas_ops + totals.ofertadas_mkt).toLocaleString('pt-BR')}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                    <span>Ops: {totals.ofertadas_ops.toLocaleString('pt-BR')}</span>
                                    <span className="text-purple-600 font-semibold">Mkt: {totals.ofertadas_mkt.toLocaleString('pt-BR')}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Corridas Completas
                                </CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{(totals.concluidas_ops + totals.concluidas_mkt).toLocaleString('pt-BR')}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                    <span>Ops: {totals.concluidas_ops.toLocaleString('pt-BR')}</span>
                                    <span className="text-purple-600 font-semibold">Mkt: {totals.concluidas_mkt.toLocaleString('pt-BR')}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Corridas Rejeitadas
                                </CardTitle>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{(totals.rejeitadas_ops + totals.rejeitadas_mkt).toLocaleString('pt-BR')}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                                    <span>Ops: {totals.rejeitadas_ops.toLocaleString('pt-BR')}</span>
                                    <span className="text-purple-600 font-semibold">Mkt: {totals.rejeitadas_mkt.toLocaleString('pt-BR')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Comparativo: Operacional vs Marketing</CardTitle>
                            <CardDescription>
                                Análise de volume e funil de corridas por semana
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead rowSpan={2} className="w-[100px]">Semana</TableHead>
                                            <TableHead colSpan={4} className="text-center border-l bg-blue-50/50 dark:bg-blue-900/10">Horas Logadas</TableHead>
                                            <TableHead colSpan={2} className="text-center border-l">Ofertadas</TableHead>
                                            <TableHead colSpan={2} className="text-center border-l">Aceitas</TableHead>
                                            <TableHead colSpan={2} className="text-center border-l">Completas</TableHead>
                                            <TableHead colSpan={2} className="text-center border-l">Rejeitadas</TableHead>
                                        </TableRow>
                                        <TableRow>
                                            {/* Hours Sub-headers */}
                                            <TableHead className="text-right border-l bg-blue-50/50 dark:bg-blue-900/10 text-xs">Operacional</TableHead>
                                            <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-xs text-purple-600 font-semibold">Marketing</TableHead>
                                            <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-xs text-slate-500">% Ops</TableHead>
                                            <TableHead className="text-right bg-blue-50/50 dark:bg-blue-900/10 text-xs text-purple-500 font-semibold">% Mkt</TableHead>

                                            {/* Ofertadas Sub-headers */}
                                            <TableHead className="text-right border-l text-xs">Ops</TableHead>
                                            <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>

                                            {/* Aceitas Sub-headers */}
                                            <TableHead className="text-right border-l text-xs">Ops</TableHead>
                                            <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>

                                            {/* Completas Sub-headers */}
                                            <TableHead className="text-right border-l text-xs">Ops</TableHead>
                                            <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>

                                            {/* Rejeitadas Sub-headers */}
                                            <TableHead className="text-right border-l text-xs">Ops</TableHead>
                                            <TableHead className="text-right text-xs text-purple-600 font-semibold">Mkt</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={13} className="h-24 text-center">
                                                    Nenhum dado encontrado para o período selecionado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((row) => {
                                                const totalHours = row.segundos_ops + row.segundos_mkt;
                                                return (
                                                    <TableRow key={row.semana_iso}>
                                                        <TableCell className="font-medium whitespace-nowrap">
                                                            Semana {extractWeekNumber(row.semana_iso)}
                                                        </TableCell>

                                                        {/* Hours */}
                                                        <TableCell className="text-right font-mono border-l bg-blue-50/30 dark:bg-blue-900/5">{formatDuration(row.segundos_ops)}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-purple-600 dark:text-purple-400 bg-blue-50/30 dark:bg-blue-900/5">{formatDuration(row.segundos_mkt)}</TableCell>
                                                        <TableCell className="text-right text-xs text-slate-500 bg-blue-50/30 dark:bg-blue-900/5">{calculatePercentage(row.segundos_ops, totalHours)}</TableCell>
                                                        <TableCell className="text-right text-xs text-purple-500 font-semibold bg-blue-50/30 dark:bg-blue-900/5">{calculatePercentage(row.segundos_mkt, totalHours)}</TableCell>

                                                        {/* Ofertadas */}
                                                        <TableCell className="text-right border-l">{row.ofertadas_ops.toLocaleString('pt-BR')}</TableCell>
                                                        <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.ofertadas_mkt.toLocaleString('pt-BR')}</TableCell>

                                                        {/* Aceitas */}
                                                        <TableCell className="text-right border-l">{row.aceitas_ops.toLocaleString('pt-BR')}</TableCell>
                                                        <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.aceitas_mkt.toLocaleString('pt-BR')}</TableCell>

                                                        {/* Completas */}
                                                        <TableCell className="text-right border-l">{row.concluidas_ops.toLocaleString('pt-BR')}</TableCell>
                                                        <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.concluidas_mkt.toLocaleString('pt-BR')}</TableCell>

                                                        {/* Rejeitadas */}
                                                        <TableCell className="text-right border-l">{row.rejeitadas_ops.toLocaleString('pt-BR')}</TableCell>
                                                        <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">{row.rejeitadas_mkt.toLocaleString('pt-BR')}</TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
});

export default MarketingComparacaoView;
