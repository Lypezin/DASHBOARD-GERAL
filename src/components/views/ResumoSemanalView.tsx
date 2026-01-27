
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EvolucaoSemanal, AderenciaSemanal, UtrSemanal } from '@/types';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { useResumoLocalData, useResumoPracasFilter } from '@/hooks/useResumoDrivers';

interface ResumoSemanalViewProps {
    evolucaoSemanal: EvolucaoSemanal[];
    aderenciaSemanal: AderenciaSemanal[];
    utrSemanal: UtrSemanal[];
    pracasDisponiveis: string[];
    anoSelecionado: number;
    loading?: boolean;
}

export const ResumoSemanalView = ({
    evolucaoSemanal,
    aderenciaSemanal,
    utrSemanal,
    pracasDisponiveis,
    anoSelecionado,
    loading
}: ResumoSemanalViewProps) => {
    // Persisted local praça filter
    const { selectedPracas, togglePraca, clearFilter } = useResumoPracasFilter();
    const [filterOpen, setFilterOpen] = React.useState(false);

    // Fetch filtered data (drivers, pedidos, SH) using local praça filter
    const { dataMap: localDataMap, loading: loadingLocal } = useResumoLocalData({
        ano: anoSelecionado,
        pracas: selectedPracas,
        activeTab: 'resumo'
    });

    // Determine if we're using local filtered data or global data
    const useLocalData = selectedPracas.length > 0;

    const processedData = useMemo(() => {
        const allWeeks = new Set<string>();

        // Always use evolucaoSemanal to determine which weeks to show
        evolucaoSemanal?.forEach(d => {
            const compositeKey = `${d.ano}-${d.semana}`;
            allWeeks.add(compositeKey);
        });

        const aderenciaMap = new Map<string, AderenciaSemanal>();
        aderenciaSemanal?.forEach(d => {
            aderenciaMap.set(String(d.semana), d);
        });

        const utrMap = new Map<string, UtrSemanal>();
        utrSemanal?.forEach(d => {
            const compositeKey = `${d.ano}-${d.semana}`;
            utrMap.set(compositeKey, d);
        });

        const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
            const strA = String(a);
            const strB = String(b);

            const splitA = strA.split('-');
            const splitB = strB.split('-');

            if (splitA.length === 2 && splitB.length === 2) {
                const yearA = parseInt(splitA[0]);
                const weekA = parseInt(splitA[1]);
                const yearB = parseInt(splitB[0]);
                const weekB = parseInt(splitB[1]);

                if (!isNaN(yearA) && !isNaN(yearB) && !isNaN(weekA) && !isNaN(weekB)) {
                    if (yearA !== yearB) return yearB - yearA;
                    return weekB - weekA;
                }
            }

            const numA = parseInt(strA);
            const numB = parseInt(strB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return numB - numA;
            }

            return strB.localeCompare(strA, undefined, { numeric: true });
        });

        const recentWeeks = sortedWeeks.slice(0, 4);

        return recentWeeks.map(weekKey => {
            let weekNum = 0;
            let yearNum = anoSelecionado;
            const strKey = String(weekKey);

            if (strKey.includes('-')) {
                const parts = strKey.split('-');
                yearNum = parseInt(parts[0]);
                weekNum = parseInt(parts[1]);
            } else {
                weekNum = parseInt(strKey);
            }

            const driverKey = `${yearNum}-${weekNum}`;
            const localData = localDataMap.get(driverKey);

            // Get global data for fallback
            const epi = evolucaoSemanal?.find(e => e.semana === weekNum);
            const api = aderenciaSemanal?.find(a => {
                if (String(a.semana) === strKey) return true;
                if (parseInt(String(a.semana)) === weekNum) return true;
                return false;
            });
            const upi = utrSemanal?.find(u => u.semana === weekNum);

            // Use local filtered data if filter is active, otherwise use global
            let pedidos: number;
            let drivers: number;
            let sh: number;
            let slots: number;

            if (useLocalData && localData) {
                pedidos = localData.pedidos;
                drivers = localData.drivers;
                sh = localData.sh;
                slots = localData.slots;
            } else if (useLocalData) {
                // Filter active but no local data for this week
                pedidos = 0;
                drivers = 0;
                sh = 0;
                slots = 0;
            } else {
                // No filter - use global data
                pedidos = epi?.corridas_completadas || 0;
                drivers = localData?.drivers || 0;
                sh = 0;
                if (api?.horas_entregues) {
                    const parts = api.horas_entregues.split(':');
                    if (parts.length >= 1) {
                        sh = parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
                    }
                } else if (api?.segundos_realizados) {
                    sh = api.segundos_realizados / 3600;
                }
                slots = localData?.slots || 0;
            }

            const frequencia = slots > 0 ? (drivers / slots) * 100 : 0;
            const utr = upi?.utr || 0;
            const aderencia = api?.aderencia_percentual || 0;
            const rejeite = epi?.corridas_rejeitadas && epi.corridas_ofertadas
                ? (epi.corridas_rejeitadas / epi.corridas_ofertadas) * 100
                : 0;

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

    }, [evolucaoSemanal, aderenciaSemanal, utrSemanal, localDataMap, anoSelecionado, useLocalData]);

    const displayRows = processedData;
    const isLoading = loading || loadingLocal;

    return (
        <div className="space-y-6 w-full max-w-[1400px] mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Resumo Semanal
                    </CardTitle>

                    {/* Local Praça Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {selectedPracas.length === 0
                                ? "Filtrar por Praça"
                                : `${selectedPracas.length} praça(s)`}
                            <svg className={cn("w-4 h-4 transition-transform", filterOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {filterOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecione as Praças</span>
                                    {selectedPracas.length > 0 && (
                                        <button
                                            onClick={() => { clearFilter(); setFilterOpen(false); }}
                                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                        >
                                            Limpar
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto p-2">
                                    {pracasDisponiveis.map((praca) => (
                                        <label
                                            key={praca}
                                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPracas.includes(praca)}
                                                onChange={() => togglePraca(praca)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{praca}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setFilterOpen(false)}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>

                {/* Selected Praças Tags */}
                {selectedPracas.length > 0 && (
                    <div className="px-6 pb-2 flex flex-wrap gap-2">
                        {selectedPracas.map(praca => (
                            <span
                                key={praca}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                onClick={() => togglePraca(praca)}
                            >
                                {praca}
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </span>
                        ))}
                    </div>
                )}

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
                                {/* Totals Row */}
                                {displayRows.length > 0 && (
                                    <TableRow className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                                        <TableCell className="font-bold">
                                            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-md py-1 px-3 text-center inline-block min-w-[3rem] text-sm shadow-sm">
                                                TOTAL
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100">
                                            {formatNumber(displayRows.reduce((sum, row) => sum + row.pedidos, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100">
                                            {formatNumber(displayRows.reduce((sum, row) => sum + row.drivers, 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100">
                                            {formatNumber(displayRows.reduce((sum, row) => sum + row.sh, 0))}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400">—</TableCell>
                                        <TableCell className="text-right text-slate-400">—</TableCell>
                                        <TableCell className="text-right text-slate-400">—</TableCell>
                                        <TableCell className="text-right text-slate-400">—</TableCell>
                                    </TableRow>
                                )}
                                {displayRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {isLoading ? 'Carregando dados...' : 'Nenhum dado disponível para o período.'}
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
