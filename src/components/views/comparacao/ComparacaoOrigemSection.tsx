import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoOrigemTable } from './ComparacaoOrigemTable';
import { SectionCard } from './components/SectionCard';
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
  if (origensDisponiveis.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title="Comparação por Origem"
      description="Aderência por origem entre as semanas"
      accentColor="bg-rose-500"
      actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />}
      noPadding
    >
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
    </SectionCard>
  );
};
