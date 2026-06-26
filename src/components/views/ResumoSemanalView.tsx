'use client';

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AderenciaSemanal, AderenciaDia } from '@/types';
import { useResumoLocalData } from '@/hooks/data/useResumoDrivers';
import { useResumoPracasFilter } from '@/hooks/data/useResumoPracasFilter';
import { useResumoSemanalLogic } from '@/hooks/data/useResumoSemanalLogic';
import { ResumoFilters } from './resumo-semanal/ResumoFilters';
import { ResumoTable } from './resumo-semanal/ResumoTable';
import { handleExportExcelResumoSemanal } from './resumo-semanal/ResumoSemanalExcelExport';
import { handleCopyTable as copyTableHelper } from './resumo-semanal/utils/copyHelpers';
import { SelectedPracasTags } from './resumo-semanal/SelectedPracasTags';
import { useDashboardEvolucao } from '@/hooks/dashboard/useDashboardEvolucao';
import { ViewTransition } from '@/components/ui/view-transition';
import type { FilterPayload } from '@/types/filters';
import { ViewContainer } from '@/components/layout/ViewContainer';

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
    const { evolucaoSemanal, utrSemanal, loading: loadingEvolucao } = useDashboardEvolucao({
        filterPayload,
        anoEvolucao: anoSelecionado,
        activeTab: 'resumo'
    });

    const loading = loadingEvolucao;
    const { selectedPracas, togglePraca, clearFilter } = useResumoPracasFilter();
    const useLocalData = selectedPracas.length > 0;

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
        <ViewTransition stateKey="resumo-semanal-content">
            <ViewContainer className="space-y-6 py-6">
            <Card className="border-none bg-white/50 shadow-sm backdrop-blur-sm dark:bg-slate-900/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-xl font-bold text-transparent">
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
            </ViewContainer>
        </ViewTransition>
    );
});

ResumoSemanalView.displayName = 'ResumoSemanalView';
