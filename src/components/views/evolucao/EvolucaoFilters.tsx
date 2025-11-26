import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, BarChart2, Megaphone, CheckCircle2, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Evolução {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                Acompanhe a evolução de corridas e horas ao longo do tempo
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Ano */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Ano:
              </label>
              <select
                value={anoSelecionado}
                onChange={(e) => onAnoChange(Number(e.target.value))}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Mensal/Semanal */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
              <button
                onClick={() => onViewModeChange('mensal')}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  viewMode === 'mensal'
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <Calendar className="h-4 w-4" />
                Mensal
              </button>
              <button
                onClick={() => onViewModeChange('semanal')}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  viewMode === 'semanal'
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <BarChart2 className="h-4 w-4" />
                Semanal
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Seletor de Métricas (Múltipla Seleção) */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Métricas:</label>
          <div className="flex flex-wrap gap-2">
            {(['ofertadas', 'aceitas', 'completadas', 'horas'] as const).map(metric => {
              const config: Record<typeof metric, { label: string; icon: React.ReactNode; colorClass: string; activeClass: string }> = {
                ofertadas: {
                  label: 'Ofertadas',
                  icon: <Megaphone className="h-3.5 w-3.5" />,
                  colorClass: 'text-cyan-600 dark:text-cyan-400',
                  activeClass: 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-300'
                },
                aceitas: {
                  label: 'Aceitas',
                  icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                  colorClass: 'text-emerald-600 dark:text-emerald-400',
                  activeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                },
                completadas: {
                  label: 'Completadas',
                  icon: <Target className="h-3.5 w-3.5" />,
                  colorClass: 'text-blue-600 dark:text-blue-400',
                  activeClass: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                },
                horas: {
                  label: 'Horas',
                  icon: <Clock className="h-3.5 w-3.5" />,
                  colorClass: 'text-orange-600 dark:text-orange-400',
                  activeClass: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300'
                },
              };

              const item = config[metric];
              const isSelected = selectedMetrics.has(metric);

              return (
                <div
                  key={metric}
                  onClick={() => {
                    const newSet = new Set(selectedMetrics);
                    if (isSelected) {
                      newSet.delete(metric);
                      if (newSet.size === 0) newSet.add('completadas');
                    } else {
                      newSet.add(metric);
                    }
                    onMetricsChange(newSet);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                    isSelected
                      ? item.activeClass
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  )}
                >
                  {item.icon}
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
