import React from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart2, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {selectedMetrics.has('horas') && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Horas</span>
              </div>
            )}
            {selectedMetrics.has('ofertadas') && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Ofertadas</span>
              </div>
            )}
            {selectedMetrics.has('aceitas') && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Aceitas</span>
              </div>
            )}
            {selectedMetrics.has('completadas') && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Completadas</span>
              </div>
            )}
          </div>
        </div>

        {(() => {
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
                  identicalMetrics.push(d1.label, d2.label);
                }
              }
            }
          }

          if (identicalMetrics.length > 0) {
            return (
              <Alert className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-300">Nota</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  Algumas métricas têm valores idênticos e podem aparecer sobrepostas no gráfico.
                  Use a legenda para destacar cada métrica individualmente.
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}
      </CardHeader>

      <CardContent className="p-6">
        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative h-[500px] w-full">
            {chartError ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Erro ao carregar gráfico</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{chartError}</p>
                </div>
              </div>
            ) : chartData && chartData.datasets && chartData.datasets.length > 0 && chartData.labels && chartData.labels.length > 0 ? (
              <Line
                data={chartData}
                options={chartOptions}
                redraw={true}
                updateMode="default"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <BarChart2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                    Nenhum dado disponível para {anoSelecionado}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Selecione outro ano para visualizar os dados
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-lg font-medium text-amber-800 dark:text-amber-200">
                Dados de evolução temporariamente indisponíveis
              </p>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                As funções de evolução estão sendo ajustadas no servidor.
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Esta funcionalidade será reativada em breve.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
