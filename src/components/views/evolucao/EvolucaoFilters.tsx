import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { EvolucaoViewToggle } from './components/EvolucaoViewToggle';
import { EvolucaoMetricsSelector, MetricType } from './components/EvolucaoMetricsSelector';

interface EvolucaoFiltersProps {
  viewMode: 'mensal' | 'semanal';
  onViewModeChange: (mode: 'mensal' | 'semanal') => void;
  selectedMetrics: Set<MetricType>;
  onMetricsChange: (metrics: Set<MetricType>) => void;
}

export const EvolucaoFilters: React.FC<EvolucaoFiltersProps> = ({
  viewMode,
  onViewModeChange,
  selectedMetrics,
  onMetricsChange,
}) => {
  return (
    <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="p-6 pb-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Evolução {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Acompanhe a evolução de corridas e horas ao longo do tempo
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <EvolucaoViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          </div>
        </div>
      </div>

      <CardContent className="pt-2 px-6 pb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
          <EvolucaoMetricsSelector
            selectedMetrics={selectedMetrics}
            onMetricsChange={onMetricsChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
