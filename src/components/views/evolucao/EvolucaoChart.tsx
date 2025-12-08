import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EvolucaoChartLegend } from './EvolucaoChartLegend';
import { EvolucaoEmptyState } from './EvolucaoEmptyState';

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
  // Verificar se há dados reais para exibir
  const hasData = useMemo(() => {
    if (!chartData?.datasets?.length) return false;
    return chartData.datasets.some(dataset =>
      dataset.data && dataset.data.some((val: any) => val != null && val !== 0)
    );
  }, [chartData]);

  const hasDuplicateMetrics = useMemo(() => {
    const datasets = chartData?.datasets || [];
    const identicalMetrics: string[] = [];

    for (let i = 0; i < datasets.length; i++) {
      for (let j = i + 1; j < datasets.length; j++) {
        const d1 = datasets[i];
        const d2 = datasets[j];
        const values1 = d1.data.filter((v: number | null) => v != null);
        const values2 = d2.data.filter((v: number | null) => v != null);

        if (values1.length === values2.length && values1.length > 0) {
          const allEqual = values1.every((v: number, idx: number) => v === values2[idx]);
          if (allEqual && !identicalMetrics.includes(d1.label) && !identicalMetrics.includes(d2.label)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [chartData]);

  const showChart = chartData.datasets.length > 0 && chartData.labels.length > 0 && !chartError && hasData;

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Evolução {selectedMetrics.size === 1 ? 'de ' + (selectedMetrics.has('horas') ? 'Horas Trabalhadas' : selectedMetrics.has('ofertadas') ? 'Corridas Ofertadas' : selectedMetrics.has('aceitas') ? 'Corridas Aceitas' : 'Corridas Completadas') : 'de Métricas'} {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
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

      <CardContent className="p-6">
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
