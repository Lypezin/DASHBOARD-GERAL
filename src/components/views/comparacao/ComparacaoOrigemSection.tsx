import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoOrigemTable } from './ComparacaoOrigemTable';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoOrigemSectionProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
  origensDisponiveis: string[];
  totalColunasOrigem: number;
}

export const ComparacaoOrigemSection: React.FC<ComparacaoOrigemSectionProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
  origensDisponiveis,
}) => {
  if (origensDisponiveis.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Por Origem</h3>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />
      </div>
      {viewMode === 'table' ? (
        <ComparacaoOrigemTable
          semanasSelecionadas={semanasSelecionadas}
          dadosComparacao={dadosComparacao}
        />
      ) : (
        <div className="p-5">
          <ComparacaoCharts
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewMode}
            chartType="origem"
            origensDisponiveis={origensDisponiveis}
          />
        </div>
      )}
    </div>
  );
};
