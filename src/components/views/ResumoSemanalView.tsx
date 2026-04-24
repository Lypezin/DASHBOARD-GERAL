'use client';

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvolucaoSemanal, AderenciaSemanal, UtrSemanal, AderenciaDia, AderenciaDiaOrigem } from '@/types';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { useResumoLocalData } from '@/hooks/data/useResumoDrivers';
import { useResumoPracasFilter } from '@/hooks/data/useResumoPracasFilter';
import { useResumoSemanalLogic } from '@/hooks/data/useResumoSemanalLogic';
import { ResumoFilters } from './resumo-semanal/ResumoFilters';
import { ResumoTable } from './resumo-semanal/ResumoTable';
import { handleExportExcelResumoSemanal } from './resumo-semanal/ResumoSemanalExcelExport';

import { handleCopyTable as copyTableHelper } from './resumo-semanal/utils/copyHelpers';
import { SelectedPracasTags } from './resumo-semanal/SelectedPracasTags';
import { useDashboardEvolucao } from '@/hooks/dashboard/useDashboardEvolucao';
import { useDashboardMainData } from '@/hooks/dashboard/useDashboardMainData';
import type { FilterPayload } from '@/types/filters';

interface ResumoSemanalViewProps {
    filterPayload: FilterPayload;
    pracasDisponiveis: string[];
    anoSelecionado: number;
    aderenciaSemanal: AderenciaSemanal[];
    aderenciaDia?: AderenciaDia[];
}

export const ResumoSemanalView = React.memo(({
    filterPayload,
    pracasDisponiveis,
    anoSelecionado,
    aderenciaSemanal,
    aderenciaDia,
}: ResumoSemanalViewProps) => {
    // Fetch evolution and UTR data
    const { evolucaoSemanal, utrSemanal, loading: loadingEvolucao } = useDashboardEvolucao({ 
        filterPayload, 
        anoEvolucao: anoSelecionado,
        activeTab: 'resumo'
    });

    const loading = loadingEvolucao;
    // Persisted local praça filter
    const { selectedPracas, togglePraca, clearFilter } = useResumoPracasFilter();
    const useLocalData = selectedPracas.length > 0;

    // Fetch filtered data (drivers, pedidos, SH) using local praça filter
    const { dataMap: localDataMap, loading: loadingLocal } = useResumoLocalData({
        ano: anoSelecionado,
        pracas: selectedPracas,
        activeTab: 'resumo',
        enabled: useLocalData
    });

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

    const handleCopyTable = useCallback(() => {
        copyTableHelper(displayRows);
    }, [displayRows]);

    const handleExportTable = useCallback(() => {
        handleExportExcelResumoSemanal(displayRows, new Date().toISOString().split('T')[0]);
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
                        onExportTable={handleExportTable}
                        hasData={displayRows.length > 0}
                    />
                </CardHeader>

                <SelectedPracasTags selectedPracas={selectedPracas} togglePraca={togglePraca} />

                <CardContent>
                    <ResumoTable data={displayRows} isLoading={!!isLoading} />
                </CardContent>
            </Card>
        </div>
    );
});

ResumoSemanalView.displayName = 'ResumoSemanalView';
