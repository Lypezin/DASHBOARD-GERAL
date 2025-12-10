import React, { useMemo } from 'react';
import { useMarketingComparacao } from './useMarketingComparacao';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
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

const MarketingComparacaoView = React.memo(function MarketingComparacaoView({ filters }: MarketingComparacaoViewProps) {
    const { user } = useAuth();

    // Determine the date range to use
    // If 'intervalo' mode, use dataInicial/Final directly.
    // Use sensible defaults if empty
    const dataInicial = filters.dataInicial || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const dataFinal = filters.dataFinal || new Date().toISOString().split('T')[0];
    const praca = filters.praca;

    const { data, loading, error } = useMarketingComparacao(
        dataInicial,
        dataFinal,
        user?.organization_id || undefined,
        praca
    );

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
                <Card>
                    <CardHeader>
                        <CardTitle>Horas: Operacional vs Marketing</CardTitle>
                        <CardDescription>Comparativo semanal de horas logadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-slate-200 dark:border-slate-800">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Semana</TableHead>
                                        <TableHead className="text-right">Operacional</TableHead>
                                        <TableHead className="text-right">Marketing</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row) => (
                                        <TableRow key={row.semana_iso}>
                                            <TableCell className="font-medium">{row.semana_iso}</TableCell>
                                            <TableCell className="text-right font-mono">{formatDuration(row.segundos_ops)}</TableCell>
                                            <TableCell className="text-right font-mono text-purple-600 dark:text-purple-400 font-bold">{formatDuration(row.segundos_mkt)}</TableCell>
                                            <TableCell className="text-right font-mono text-slate-500">{formatDuration(row.segundos_ops + row.segundos_mkt)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Nenhum dado encontrado para o período selecionado.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
});

export default MarketingComparacaoView;
