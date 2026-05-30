import React from 'react';
import { TrendingUp } from 'lucide-react';
import { EvolucaoViewToggle } from './components/EvolucaoViewToggle';
import { EvolucaoMetricsSelector, MetricType } from './components/EvolucaoMetricsSelector';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

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
    <SaasPanel className="overflow-visible">
      <SaasPanelHeader
        eyebrow="Evolução"
        title={`Evolução ${viewMode === 'mensal' ? 'mensal' : 'semanal'}`}
        description="Acompanhe corridas e horas ao longo do tempo com métricas selecionáveis."
        icon={TrendingUp}
        actions={(
          <EvolucaoViewToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        )}
      />

      <div className="p-4 sm:p-5">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/55">
          <EvolucaoMetricsSelector
            selectedMetrics={selectedMetrics}
            onMetricsChange={onMetricsChange}
          />
        </div>
      </div>
    </SaasPanel>
  );
};
