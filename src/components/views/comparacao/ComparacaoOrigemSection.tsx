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
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between px-8 py-6 border-b border-transparent">
        <h3 className="text-lg text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-1 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
          <span className="font-semibold tracking-tight">Por Origem</span>
        </h3>
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
