import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EvolucaoChartLegend } from './EvolucaoChartLegend';
import { EvolucaoEmptyState } from './EvolucaoEmptyState';
import { hasChartData, detectDuplicateMetrics, shouldShowChart } from './chartValidation';

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

  return (
    <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 w-1.5 h-6 rounded-full inline-block"></span>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Evolução {selectedMetrics.size === 1 ? 'de ' + (selectedMetrics.has('horas') ? 'Horas Trabalhadas' : selectedMetrics.has('ofertadas') ? 'Corridas Ofertadas' : selectedMetrics.has('aceitas') ? 'Corridas Aceitas' : 'Corridas Completadas') : 'de Métricas'} {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400 pl-3.5">
              Análise detalhada de {selectedMetrics.size} {selectedMetrics.size === 1 ? 'métrica' : 'métricas'} ({dadosAtivosLength} {viewMode === 'mensal' ? 'meses' : 'semanas'} exibidos)
            </CardDescription>
          </div>

          <EvolucaoChartLegend selectedMetrics={selectedMetrics} />
        </div>

        {hasDuplicateMetrics && (
          <Alert className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Nota</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Algumas métricas têm valores idênticos e podem aparecer sobrepostas no gráfico.
              Use a legenda para destacar cada métrica individualmente.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="p-6 pt-2">
        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative h-[500px] w-full">
            <EvolucaoEmptyState
              anoSelecionado={anoSelecionado}
              hasNoData={!hasData}
              chartError={chartError}
              labelsLength={chartData.labels.length}
            />

            {showChart && (
              <Line
                data={chartData}
                options={chartOptions}
                redraw={true}
                updateMode="default"
              />
            )}
          </div>
        ) : (
          <EvolucaoEmptyState
            anoSelecionado={anoSelecionado}
            hasNoData={false}
            chartError={null}
            labelsLength={0}
          />
        )}
      </CardContent>
    </Card>
  );
};
