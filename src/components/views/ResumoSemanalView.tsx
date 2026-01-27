
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvolucaoSemanal, AderenciaSemanal, UtrSemanal } from '@/types';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface ResumoSemanalViewProps {
    evolucaoSemanal: EvolucaoSemanal[];
    aderenciaSemanal: AderenciaSemanal[];
    utrSemanal: UtrSemanal[];
    loading?: boolean;
}

export const ResumoSemanalView = ({
    evolucaoSemanal,
    aderenciaSemanal,
    utrSemanal,
    loading
}: ResumoSemanalViewProps) => {

    const processedData = useMemo(() => {
        // Collect all unique weeks from all data sources
        const allWeeks = new Set<string>();

        const evolucaoMap = new Map<string, EvolucaoSemanal>();
        evolucaoSemanal?.forEach(d => {
            const compositeKey = `${d.ano}-${d.semana}`;
            evolucaoMap.set(compositeKey, d);
            allWeeks.add(compositeKey);
        });

        // aderenciaSemanal items might not have 'ano'. Usually they are for the selected year or context.
        // Assuming current logic context provides relevant data.
        const aderenciaMap = new Map<string, AderenciaSemanal>();
        aderenciaSemanal?.forEach(d => {
            // Using logic to try to map 'semana' string to our composite key if possible
            // But if d.semana is just "42", we treat it as such.
            allWeeks.add(d.semana);
        });

        const utrMap = new Map<string, UtrSemanal>();
        utrSemanal?.forEach(d => {
            const compositeKey = `${d.ano}-${d.semana}`;
            utrMap.set(compositeKey, d);
            allWeeks.add(compositeKey);
        });

        // Convert Set to Array and Sort Descending (Newest first)
        const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
            // Sort by year then week if format is YYYY-WW, otherwise fallback
            // This sorting is heuristic-based if formats mix.
            const splitA = a.split('-');
            const splitB = b.split('-');

            if (splitA.length === 2 && splitB.length === 2) {
                const yearA = parseInt(splitA[0]);
                const weekA = parseInt(splitA[1]);
                const yearB = parseInt(splitB[0]);
                const weekB = parseInt(splitB[1]);
                if (yearA !== yearB) return yearB - yearA;
                return weekB - weekA;
            }

            // Fallback for simple strings (numeric sort desc)
            return parseInt(b) - parseInt(a);
        });

        // Take last 4 weeks
        const recentWeeks = sortedWeeks.slice(0, 4);

        return recentWeeks.map(weekKey => {
            // Heuristic matching
            let weekNum = 0;
            if (weekKey.includes('-')) {
                weekNum = parseInt(weekKey.split('-')[1]);
            } else {
                weekNum = parseInt(weekKey);
            }

            // Find in arrays
            const epi = evolucaoSemanal?.find(e => e.semana === weekNum);
            const api = aderenciaSemanal?.find(a => {
                // Aderencia 'semana' formatting is inconsistent in types (string) vs number.
                // Try exact match or match with week number
                if (a.semana === weekKey) return true;
                if (parseInt(a.semana) === weekNum) return true;
                return false;
            });
            const upi = utrSemanal?.find(u => u.semana === weekNum);

            const pedidos = epi?.corridas_completadas || 0;

            // Drivers not yet available in types, using placeholder 0
            const drivers = 0;

            // SH: "horas_entregues" from aderencia (string HH:MM:SS presumably or decimal string)
            let sh = 0;
            if (api?.horas_entregues) {
                // Simple parse if it's "HH:MM:SS" or similar. 
                // Assuming helper or direct float. If string "1230:45", we need a parser.
                // Using parseFloat for now if it's decimal-like, or 0.
                // Verify converter usage if imported.
                // checking `converterHorasParaDecimal` imported in existing files.
                // For now, raw display or simple parse.
                sh = parseFloat(api.horas_entregues.replace(':', '.')); // Very naiive
            }

            const frequencia = 0; // drivers / slots

            const utr = upi?.utr || 0;
            const aderencia = api?.aderencia_percentual || 0;
            const rejeite = epi?.corridas_rejeitadas && epi.corridas_ofertadas
                ? (epi.corridas_rejeitadas / epi.corridas_ofertadas) * 100
                : 0;

            // Clean label
            const label = epi?.semana_label || `Semana ${weekNum}`;

            return {
                label: weekKey,
                semana_label: label,
                pedidos,
                drivers,
                sh,
                frequencia,
                utr,
                aderencia,
                rejeite
            };
        });

    }, [evolucaoSemanal, aderenciaSemanal, utrSemanal]);

    const displayRows = processedData;

    return (
        <div className="space-y-6 w-full max-w-[1400px] mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Resumo Semanal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">SEMANA</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Pedidos</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Drivers</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">SH</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Frequência</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">UTR</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Aderência</TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Rejeite</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayRows.map((row) => (
                                    <TableRow key={row.label} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="bg-blue-600 text-white rounded-md py-1 px-3 text-center inline-block min-w-[3rem] text-sm shadow-sm font-bold">
                                                {row.semana_label.replace('Semana ', '')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatNumber(row.pedidos)}</TableCell>
                                        <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatNumber(row.drivers)}</TableCell>
                                        <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatNumber(row.sh)}</TableCell>
                                        <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatPercent(row.frequencia)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatNumber(row.utr, 1)}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-700 dark:text-slate-200">{formatPercent(row.aderencia)}</TableCell>
                                        <TableCell className="text-right text-red-600 dark:text-red-400 font-medium">{formatPercent(row.rejeite)}</TableCell>
                                    </TableRow>
                                ))}
                                {displayRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {loading ? 'Carregando dados...' : 'Nenhum dado disponível para o período.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
