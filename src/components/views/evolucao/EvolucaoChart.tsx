import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Info, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EvolucaoChartLegend } from './EvolucaoChartLegend';
import { EvolucaoEmptyState } from './EvolucaoEmptyState';
import { hasChartData, detectDuplicateMetrics, shouldShowChart } from './chartValidation';
import { SaasMetric, SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

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
  return 'pedidos';
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
  const totalSeries = chartData.datasets.length;

  return (
    <SaasPanel>
      <SaasPanelHeader
        eyebrow="Série temporal"
        title={`Evolução de ${metricTitle}`}
        description={`Análise ${viewMode === 'mensal' ? 'mensal' : 'semanal'} com leitura limpa, escala controlada e comparação de séries selecionadas.`}
        icon={TrendingUp}
        actions={<EvolucaoChartLegend selectedMetrics={selectedMetrics} />}
      />

      <div className="grid gap-3 border-b border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/30 sm:grid-cols-3 lg:px-5">
        <SaasMetric label="Períodos exibidos" value={dadosAtivosLength.toLocaleString('pt-BR')} tone="blue" />
        <SaasMetric label="Séries ativas" value={totalSeries.toLocaleString('pt-BR')} tone="emerald" />
        <SaasMetric label="Ano base" value={anoSelecionado} tone="slate" />
      </div>

      <div className="p-4 sm:p-6">
        {hasDuplicateMetrics ? (
          <Alert className="mb-4 rounded-2xl border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            <AlertTitle>Nota</AlertTitle>
            <AlertDescription>
              Algumas métricas têm valores idênticos e podem aparecer sobrepostas. Use os seletores para isolar cada série.
            </AlertDescription>
          </Alert>
        ) : null}

        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/75 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] p-3 shadow-inner dark:border-slate-800/75 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.92))] sm:p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
            <div className="relative h-[420px] w-full sm:h-[500px]">
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
                />
              ) : null}
            </div>
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
