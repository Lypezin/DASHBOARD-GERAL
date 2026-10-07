import React from 'react';
import { EvolucaoViewToggle } from './components/EvolucaoViewToggle';
import { EvolucaoMetricsSelector, MetricType } from './components/EvolucaoMetricsSelector';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';

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
    <SaasPanel className="overflow-visible rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
      <header className="flex min-w-0 flex-col gap-3 border-b border-[#e2ebf0] px-4 py-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">Configuração do gráfico</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Escolha a visualização e as métricas exibidas.</p>
        </div>
        <EvolucaoViewToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </header>

      <div className="p-4 sm:p-5">
        <EvolucaoMetricsSelector
          selectedMetrics={selectedMetrics}
          onMetricsChange={onMetricsChange}
        />
      </div>
    </SaasPanel>
  );
};
