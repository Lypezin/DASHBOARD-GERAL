import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { calculateYAxisRange } from '@/utils/charts';
import { processEvolucaoData, createChartData } from '../EvolucaoDataProcessor';
import { createEvolucaoChartOptions } from '../EvolucaoChartConfig';
import { useThemeDetector } from '@/hooks/ui/useThemeDetector';

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
    const router = useRouter();
    const pathname = usePathname();

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

    // Sync to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        let changed = false;

        if (viewMode !== 'mensal') {
            if (params.get('evo_mode') !== viewMode) { params.set('evo_mode', viewMode); changed = true; }
        } else if (params.has('evo_mode')) { params.delete('evo_mode'); changed = true; }

        const metricsArray = Array.from(selectedMetrics);
        const metricsStr = metricsArray.join(',');

        // Default is 'completadas'. If it is exactly default, clean URL? 
        // Or cleaner: only write if different from default?
        // Let's write if different from default or if exists.
        // Actually, explicit is better.

        if (metricsArray.length === 1 && metricsArray[0] === 'completadas') {
            if (params.has('evo_metrics')) { params.delete('evo_metrics'); changed = true; }
        } else {
            if (params.get('evo_metrics') !== metricsStr) { params.set('evo_metrics', metricsStr); changed = true; }
        }

        if (changed) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [viewMode, selectedMetrics, pathname, router, searchParams]);

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
