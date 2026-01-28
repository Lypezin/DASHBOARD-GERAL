
import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvolucaoSemanal, AderenciaSemanal, UtrSemanal } from '@/types';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { useResumoLocalData } from '@/hooks/useResumoDrivers';
import { useResumoPracasFilter } from '@/hooks/useResumoPracasFilter';
import { useResumoSemanalLogic } from '@/hooks/useResumoSemanalLogic';
import { ResumoFilters } from './resumo-semanal/ResumoFilters';
import { ResumoTable } from './resumo-semanal/ResumoTable';

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

    // Fetch filtered data (drivers, pedidos, SH) using local praça filter
    const { dataMap: localDataMap, loading: loadingLocal } = useResumoLocalData({
        ano: anoSelecionado,
        pracas: selectedPracas,
        activeTab: 'resumo'
    });

    // Determine if we're using local filtered data or global data
    const useLocalData = selectedPracas.length > 0;

    const processedData = useResumoSemanalLogic({
        evolucaoSemanal,
        aderenciaSemanal,
        utrSemanal,
        anoSelecionado,
        localDataMap,
        useLocalData
    });

    const displayRows = processedData;
    const isLoading = loading || loadingLocal;

    // Copy table content (without week column, headers, or totals)
    const handleCopyTable = useCallback(() => {
        if (displayRows.length === 0) return;

        // Data rows only (no headers, no totals)
        const rows = displayRows.map(row => [
            formatNumber(row.pedidos),
            formatNumber(row.drivers),
            formatNumber(row.sh),
            formatPercent(row.aderenciaMedia),
            formatNumber(row.utr, 2),
            formatPercent(row.aderencia),
            formatPercent(row.rejeite)
        ].join('\t'));

        const tableText = rows.join('\n');

        navigator.clipboard.writeText(tableText).then(() => {
            // Toast notification could be added here if needed, 
            // but the button inside ResumoFilters handles its own state for "Copied!"
        });
    }, [displayRows]);

    return (
        <div className="space-y-6 w-full max-w-[1400px] mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Resumo Semanal
                    </CardTitle>

                    <ResumoFilters
                        selectedPracas={selectedPracas}
                        pracasDisponiveis={pracasDisponiveis}
                        onFilterToggle={togglePraca}
                        onClearFilter={clearFilter}
                        onCopyTable={handleCopyTable}
                        hasData={displayRows.length > 0}
                    />
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
                    <ResumoTable data={displayRows} isLoading={!!isLoading} />
                </CardContent>
            </Card>
        </div>
    );
};
