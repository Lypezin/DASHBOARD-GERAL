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

    const getInitialViewMode = () => {
        const mode = searchParams.get('evo_mode');
        return (mode === 'semanal' ? 'semanal' : 'mensal');
    };

    const getInitialMetrics = () => {
        const metricsParam = searchParams.get('evo_metrics');
        if (metricsParam) {
            const metrics = metricsParam.split(',').filter(Boolean) as Array<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
            if (metrics.length > 0) return new Set(metrics);
        }
        return new Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>(['completadas']);
    };

    const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>(getInitialViewMode);
    const [selectedMetrics, setSelectedMetrics] = useState<Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>>(getInitialMetrics);
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
