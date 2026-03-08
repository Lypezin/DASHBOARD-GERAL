import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { calculateYAxisRange } from '@/utils/charts';
import { processEvolucaoData, createChartData } from '../EvolucaoDataProcessor';
import { createEvolucaoChartOptions } from '../EvolucaoChartConfig';
import { useThemeDetector } from '@/hooks/ui/useThemeDetector';
import { useEvolucaoUrlSync } from './useEvolucaoUrlSync';
import { getInitialViewMode, getInitialMetrics } from './evolucaoParamsHelpers';

export function useEvolucaoViewController({
    evolucaoMensal,
    evolucaoSemanal,
    loading,
    anoSelecionado,
}: {
    evolucaoMensal: EvolucaoMensal[];
    evolucaoSemanal: EvolucaoSemanal[];
    loading: boolean;
    anoSelecionado: number;
}) {
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>(() => getInitialViewMode(searchParams));
    const [selectedMetrics, setSelectedMetrics] = useState<Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>>(() => getInitialMetrics(searchParams));
    const [chartError, setChartError] = useState<string | null>(null);

    const isDarkMode = useThemeDetector();
    const isSemanal = viewMode === 'semanal';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            registerChartJS().catch((error) => {
                safeLog.error('Erro ao registrar Chart.js:', error);
                setChartError('Erro ao inicializar gráficos. Tente recarregar a página.');
            });
        }
    }, []);

    useEvolucaoUrlSync(viewMode, selectedMetrics);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            safeLog.info('[DEBUG] useEvolucaoViewController params changed:', {
                anoSelecionado,
                viewMode,
                mensalLength: evolucaoMensal?.length,
                semanalLength: evolucaoSemanal?.length
            });
        }
    }, [anoSelecionado, viewMode, evolucaoMensal, evolucaoSemanal]);

    const { dadosAtivos, baseLabels, dadosPorLabel } = useMemo(
        () => processEvolucaoData(viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado),
        [viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado]
    );

    const totalPeriodos = baseLabels.length;

    const chartData = useMemo(
        () => createChartData(selectedMetrics, baseLabels, dadosPorLabel, isSemanal),
        [selectedMetrics, baseLabels, dadosPorLabel, isSemanal]
    );

    const yAxisRange = useMemo(() => {
        if (!chartData?.datasets || chartData.datasets.length === 0) {
            return { min: undefined, max: undefined };
        }
        return calculateYAxisRange(chartData.datasets);
    }, [chartData?.datasets]);

    const chartOptions = useMemo(
        () => createEvolucaoChartOptions(isSemanal, isDarkMode, selectedMetrics, yAxisRange),
        [isSemanal, isDarkMode, selectedMetrics, yAxisRange]
    );

    return {
        state: {
            loading,
            viewMode,
            selectedMetrics,
            chartError,
            dadosAtivos,
            totalPeriodos,
            chartData,
            chartOptions
        },
        actions: {
            setViewMode,
            setSelectedMetrics
        }
    };
}
