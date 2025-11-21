import React, { useState, useEffect, useMemo } from 'react';
import { EvolucaoMensal, EvolucaoSemanal } from '@/types';
import { registerChartJS } from '@/lib/chartConfig';
import { safeLog } from '@/lib/errorHandler';
import { calculateYAxisRange } from '@/utils/charts';
import { EvolucaoFilters } from './evolucao/EvolucaoFilters';
import { EvolucaoChart } from './evolucao/EvolucaoChart';
import { EvolucaoStatsCards } from './evolucao/EvolucaoStatsCards';
import { processEvolucaoData, createChartData } from './evolucao/EvolucaoDataProcessor';
import { createEvolucaoChartOptions } from './evolucao/EvolucaoChartConfig';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  
  useEffect(() => {
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      }
    };
    
    checkTheme();
    
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    return () => observer.disconnect();
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
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-blue-950/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Skeleton */}
        <div className="relative rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="mb-6 space-y-2">
              <div className="h-7 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            
            <div className="h-[550px] rounded-xl bg-white/50 dark:bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando dados de evolução...</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Aguarde enquanto buscamos as informações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100/30 p-6 shadow-lg dark:border-slate-800/50 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-950/20">
              <div className="space-y-3">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
