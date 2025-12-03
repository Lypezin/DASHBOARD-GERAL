import React, { useState, useEffect, useMemo } from 'react';
import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { calculateYAxisRange } from '@/utils/charts';
import { EvolucaoFilters } from './evolucao/EvolucaoFilters';
import { EvolucaoChart } from './evolucao/EvolucaoChart';
import { EvolucaoStatsCards } from './evolucao/EvolucaoStatsCards';
import { EvolucaoSkeleton } from './evolucao/EvolucaoSkeleton';
import { processEvolucaoData, createChartData } from './evolucao/EvolucaoDataProcessor';
import { createEvolucaoChartOptions } from './evolucao/EvolucaoChartConfig';
import { useThemeDetector } from '@/hooks/useThemeDetector';

const EvolucaoView = React.memo(function EvolucaoView({
  evolucaoMensal,
  evolucaoSemanal,
  loading,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
}: {
  evolucaoMensal: EvolucaoMensal[];
  evolucaoSemanal: EvolucaoSemanal[];
  loading: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
}) {
  const [viewMode, setViewMode] = useState<'mensal' | 'semanal'>('mensal');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>>(new Set(['completadas']));
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

  useEffect(() => {
    setSelectedMetrics(prev => {
      if (prev.size === 0) {
        return new Set(['completadas']);
      }
      return prev;
    });
  }, []);

  const { dadosAtivos, baseLabels, dadosPorLabel } = useMemo(
    () => processEvolucaoData(viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado),
    [viewMode, evolucaoMensal, evolucaoSemanal, anoSelecionado]
  );

  // ⚠️ CORREÇÃO: Usar baseLabels.length para mostrar todos os períodos (12 meses ou 53 semanas)
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

  // Early return APÓS todos os hooks
  if (loading) {
    return <EvolucaoSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EvolucaoFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        anoSelecionado={anoSelecionado}
        anosDisponiveis={anosDisponiveis}
        onAnoChange={onAnoChange}
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
      />

      <EvolucaoChart
        chartData={chartData}
        chartOptions={chartOptions}
        chartError={chartError}
        anoSelecionado={anoSelecionado}
        selectedMetrics={selectedMetrics}
        viewMode={viewMode}
        dadosAtivosLength={totalPeriodos}
      />

      <EvolucaoStatsCards
        dadosAtivos={dadosAtivos}
        viewMode={viewMode}
        anoSelecionado={anoSelecionado}
      />
    </div>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
