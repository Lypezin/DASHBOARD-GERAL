import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoSubPracaTable } from './ComparacaoSubPracaTable';
import { ViewModeToggle } from './components/ViewModeToggle';

interface ComparacaoSubPracaSectionProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
}

export const ComparacaoSubPracaSection: React.FC<ComparacaoSubPracaSectionProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
}) => {
  if (!dadosComparacao.some(d => (d.aderencia_sub_praca && d.aderencia_sub_praca.length > 0) || (d.sub_praca && d.sub_praca.length > 0))) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Por Sub-Praça</h3>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />
      </div>
      {viewMode === 'table' ? (
        <ComparacaoSubPracaTable
          dadosComparacao={dadosComparacao}
          semanasSelecionadas={semanasSelecionadas}
        />
      ) : (
        <div className="p-5">
          <ComparacaoCharts
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewMode}
            chartType="subPraca"
          />
        </div>
      )}
    </div>
  );
};
