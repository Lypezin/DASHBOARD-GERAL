import React from 'react';

interface EvolucaoFiltersProps {
  viewMode: 'mensal' | 'semanal';
  onViewModeChange: (mode: 'mensal' | 'semanal') => void;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
  selectedMetrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>;
  onMetricsChange: (metrics: Set<'ofertadas' | 'aceitas' | 'completadas' | 'horas'>) => void;
}

export const EvolucaoFilters: React.FC<EvolucaoFiltersProps> = ({
  viewMode,
  onViewModeChange,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
  selectedMetrics,
  onMetricsChange,
}) => {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
        
        <div className="relative border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4 dark:border-blue-800 dark:from-slate-800 dark:to-blue-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📉</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Evolução {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
                </h3>
                <p className="mt-1 text-base text-slate-600 dark:text-slate-400">
                  Acompanhe a evolução de corridas e horas ao longo do tempo
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Seletor de Ano */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ano:</label>
                <select
                  value={anoSelecionado}
                  onChange={(e) => onAnoChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Mensal/Semanal */}
              <div className="flex gap-2">
                <button
                  onClick={() => onViewModeChange('mensal')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                    viewMode === 'mensal'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-blue-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/20 dark:border-blue-800'
                  }`}
                >
                  📅 Mensal
                </button>
                <button
                  onClick={() => onViewModeChange('semanal')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                    viewMode === 'semanal'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border-2 border-blue-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950/20 dark:border-blue-800'
                  }`}
                >
                  📊 Semanal
                </button>
              </div>

              {/* Seletor de Métricas (Múltipla Seleção) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Métricas:</label>
                <div className="flex flex-wrap gap-2">
                  {(['ofertadas', 'aceitas', 'completadas', 'horas'] as const).map(metric => {
                    const labels: Record<typeof metric, string> = {
                      ofertadas: '📢 Ofertadas',
                      aceitas: '✅ Aceitas',
                      completadas: '🚗 Completadas',
                      horas: '⏱️ Horas',
                    };
                    const colors: Record<typeof metric, { bg: string; border: string; dot: string }> = {
                      ofertadas: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-700', dot: 'bg-cyan-500' },
                      aceitas: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500' },
                      completadas: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-500' },
                      horas: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-300 dark:border-orange-700', dot: 'bg-orange-500' },
                    };
                    const metricColors = colors[metric];
                    return (
                      <label
                        key={metric}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          selectedMetrics.has(metric)
                            ? `${metricColors.bg} ${metricColors.border}`
                            : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMetrics.has(metric)}
                          onChange={(e) => {
                            const newSet = new Set(selectedMetrics);
                            if (e.target.checked) {
                              newSet.add(metric);
                            } else {
                              newSet.delete(metric);
                              if (newSet.size === 0) {
                                newSet.add('completadas');
                              }
                            }
                            onMetricsChange(newSet);
                          }}
                          className={`w-4 h-4 rounded focus:ring-2 ${
                            metric === 'ofertadas' ? 'text-cyan-600 focus:ring-cyan-500' :
                            metric === 'aceitas' ? 'text-emerald-600 focus:ring-emerald-500' :
                            metric === 'completadas' ? 'text-blue-600 focus:ring-blue-500' :
                            'text-orange-600 focus:ring-orange-500'
                          }`}
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${metricColors.dot} shadow-md`}></span>
                          {labels[metric]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

