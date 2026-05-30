import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Info, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EvolucaoChartLegend } from './EvolucaoChartLegend';
import { EvolucaoEmptyState } from './EvolucaoEmptyState';
import { hasChartData, detectDuplicateMetrics, shouldShowChart } from './chartValidation';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

interface EvolucaoChartProps {
  chartData: {
    labels: string[];
    datasets: any[];
  };
  chartOptions: any;
  chartError: string | null;
  anoSelecionado: number;
  selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
  viewMode: 'mensal' | 'semanal';
  dadosAtivosLength: number;
}

function getMetricTitle(selectedMetrics: EvolucaoChartProps['selectedMetrics']) {
  if (selectedMetrics.size !== 1) return 'métricas';
  if (selectedMetrics.has('horas')) return 'horas trabalhadas';
  if (selectedMetrics.has('ofertadas')) return 'corridas ofertadas';
  if (selectedMetrics.has('aceitas')) return 'corridas aceitas';
  return 'corridas completadas';
}

export const EvolucaoChart: React.FC<EvolucaoChartProps> = ({
  chartData,
  chartOptions,
  chartError,
  anoSelecionado,
  selectedMetrics,
  viewMode,
  dadosAtivosLength,
}) => {
  const hasData = useMemo(() => hasChartData(chartData), [chartData]);
  const hasDuplicateMetrics = useMemo(() => detectDuplicateMetrics(chartData), [chartData]);
  const showChart = shouldShowChart(chartData, chartError, hasData);
  const metricTitle = getMetricTitle(selectedMetrics);

  return (
    <SaasPanel>
      <SaasPanelHeader
        eyebrow="Série temporal"
        title={`Evolução de ${metricTitle} ${viewMode === 'mensal' ? 'mensal' : 'semanal'}`}
        description={`Análise de ${selectedMetrics.size} ${selectedMetrics.size === 1 ? 'métrica' : 'métricas'} em ${dadosAtivosLength} ${viewMode === 'mensal' ? 'meses' : 'semanas'} exibidos.`}
        icon={TrendingUp}
        actions={<EvolucaoChartLegend selectedMetrics={selectedMetrics} />}
      />

      <div className="p-4 sm:p-6">
        {hasDuplicateMetrics ? (
          <Alert className="mb-4 rounded-2xl border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            <AlertTitle>Nota</AlertTitle>
            <AlertDescription>
              Algumas métricas têm valores idênticos e podem aparecer sobrepostas no gráfico. Use a legenda para destacar cada métrica individualmente.
            </AlertDescription>
          </Alert>
        ) : null}

        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative h-[500px] w-full rounded-2xl border border-slate-200/70 bg-white/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
            <EvolucaoEmptyState
              anoSelecionado={anoSelecionado}
              hasNoData={!hasData}
              chartError={chartError}
              labelsLength={chartData.labels.length}
            />

            {showChart ? (
              <Line
                data={chartData}
                options={chartOptions}
                redraw={true}
                updateMode="default"
              />
            ) : null}
          </div>
        ) : (
          <EvolucaoEmptyState
            anoSelecionado={anoSelecionado}
            hasNoData={false}
            chartError={null}
            labelsLength={0}
          />
        )}
      </div>
    </SaasPanel>
  );
};
