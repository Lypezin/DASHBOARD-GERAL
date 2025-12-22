import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { EvolucaoYearSelector } from './components/EvolucaoYearSelector';
import { EvolucaoViewToggle } from './components/EvolucaoViewToggle';
import { EvolucaoMetricsSelector, MetricType } from './components/EvolucaoMetricsSelector';

interface EvolucaoFiltersProps {
  viewMode: 'mensal' | 'semanal';
  onViewModeChange: (mode: 'mensal' | 'semanal') => void;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
  selectedMetrics: Set<MetricType>;
  onMetricsChange: (metrics: Set<MetricType>) => void;
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
            <EvolucaoYearSelector
              anoSelecionado={anoSelecionado}
              anosDisponiveis={anosDisponiveis}
              onAnoChange={onAnoChange}
            />

            <EvolucaoViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <EvolucaoMetricsSelector
          selectedMetrics={selectedMetrics}
          onMetricsChange={onMetricsChange}
        />
      </CardContent>
    </Card>
  );
};
