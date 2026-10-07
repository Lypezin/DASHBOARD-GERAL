import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Info, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EvolucaoChartLegend } from './EvolucaoChartLegend';
import { EvolucaoEmptyState } from './EvolucaoEmptyState';
import { hasChartData, detectDuplicateMetrics, shouldShowChart } from './chartValidation';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';

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
    <SaasPanel className="overflow-hidden rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
      <header className="flex min-w-0 flex-col gap-3 border-b border-[#e2ebf0] px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4f7] text-[#38708e] dark:bg-slate-800 dark:text-sky-300">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Evolução de {metricTitle}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Visualização {viewMode === 'mensal' ? 'mensal' : 'semanal'} das métricas selecionadas.
            </p>
          </div>
        </div>
        <EvolucaoChartLegend selectedMetrics={selectedMetrics} />
      </header>

      <dl className="grid grid-cols-3 divide-x divide-[#e2ebf0] border-b border-[#e2ebf0] bg-[#f8fafb] dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="px-4 py-3 sm:px-5">
          <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Períodos exibidos</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-[#183f58] dark:text-slate-100">{dadosAtivosLength.toLocaleString('pt-BR')}</dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Séries ativas</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-[#183f58] dark:text-slate-100">{totalSeries.toLocaleString('pt-BR')}</dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Ano base</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-[#183f58] dark:text-slate-100">{anoSelecionado}</dd>
        </div>
      </dl>

      <div className="p-4 sm:p-5">
        {hasDuplicateMetrics ? (
          <Alert className="mb-4 rounded-lg border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            <AlertTitle>Nota</AlertTitle>
            <AlertDescription>
              Algumas métricas têm valores idênticos e podem aparecer sobrepostas. Use os seletores para isolar cada série.
            </AlertDescription>
          </Alert>
        ) : null}

        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative overflow-visible rounded-lg border border-[#e2ebf0] bg-white p-2 dark:border-slate-800 dark:bg-slate-950/40 sm:p-4">
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
