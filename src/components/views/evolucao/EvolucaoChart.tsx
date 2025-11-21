import React from 'react';
import { Line } from 'react-chartjs-2';

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
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative rounded-3xl border-0 bg-gradient-to-br from-white via-white to-blue-50/20 p-8 shadow-xl dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
        
        {chartData.datasets.length > 0 && chartData.labels.length > 0 ? (
          <div className="relative z-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    📊
                  </span>
                  Evolução {selectedMetrics.size === 1 ? 'de ' + (selectedMetrics.has('horas') ? 'Horas Trabalhadas' : selectedMetrics.has('ofertadas') ? 'Corridas Ofertadas' : selectedMetrics.has('aceitas') ? 'Corridas Aceitas' : 'Corridas Completadas') : 'de Métricas'} {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Análise detalhada de {selectedMetrics.size} {selectedMetrics.size === 1 ? 'métrica' : 'métricas'} ({dadosAtivosLength} {viewMode === 'mensal' ? 'meses' : 'semanas'} exibidos)
                </p>
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
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-800 dark:bg-amber-950/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          <span className="font-semibold">ℹ️ Nota:</span> Algumas métricas têm valores idênticos e podem aparecer sobrepostas no gráfico. 
                          Use a legenda para destacar cada métrica individualmente.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              <div className="hidden lg:flex items-center gap-2 flex-wrap">
                {selectedMetrics.has('horas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Horas</span>
                  </div>
                )}
                {selectedMetrics.has('ofertadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-md"></div>
                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Ofertadas</span>
                  </div>
                )}
                {selectedMetrics.has('aceitas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md"></div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Aceitas</span>
                  </div>
                )}
                {selectedMetrics.has('completadas') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md"></div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Completadas</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative h-[550px] rounded-xl bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-md shadow-inner border border-slate-200/50 dark:border-slate-700/50">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-indigo-100/20 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-indigo-950/10"></div>
              <div className="relative z-10 h-full w-full">
                {chartError ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Erro ao carregar gráfico</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{chartError}</p>
                    </div>
                  </div>
                ) : chartData && chartData.datasets && chartData.datasets.length > 0 && chartData.labels && chartData.labels.length > 0 ? (
                  <Line 
                    data={{
                      ...chartData,
                      // ⚠️ CRÍTICO: Garantir que todos os labels estão presentes
                      labels: chartData.labels || []
                    }} 
                    options={chartOptions}
                    redraw={true}
                    updateMode="default"
                  />
                ) : (
                  <div className="relative z-10 flex h-[500px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="text-4xl">📊</span>
                      </div>
                      <p className="text-xl font-bold text-slate-600 dark:text-slate-300">
                        Nenhum dado disponível para {anoSelecionado}
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Selecione outro ano para visualizar os dados
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex h-[500px] items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <span className="text-4xl">⚠️</span>
              </div>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-200">
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
      </div>
    </div>
  );
};

