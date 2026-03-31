import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoSectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  type: 'dia' | 'subPraca' | 'origem';
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
  origensDisponiveis?: string[];
  totalColunasOrigem?: number;
}

export const ComparacaoSection: React.FC<ComparacaoSectionProps> = ({
  title,
  type,
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
}) => {
  if (type === 'dia') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between px-8 py-6 border-b border-transparent">
          <h3 className="text-lg text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-1 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
            <span className="font-semibold tracking-tight">{title}</span>
          </h3>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />
        </div>
        {viewMode === 'table' ? (
          <ComparacaoDiaTable
            semanasSelecionadas={semanasSelecionadas}
            dadosComparacao={dadosComparacao}
          />
        ) : (
          <div className="p-5">
            <ComparacaoCharts
              dadosComparacao={dadosComparacao}
              semanasSelecionadas={semanasSelecionadas}
              viewMode={viewMode}
              chartType="dia"
            />
          </div>
        )}
      </div>
    );
  }
  return null;
};
