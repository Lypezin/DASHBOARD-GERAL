import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';
import { SectionCard } from './components/SectionCard';
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
  description,
  type,
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
}) => {
  if (type === 'dia') {
    return (
      <SectionCard
        title={title}
        description={description}
        accentColor="bg-blue-500"
        actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />}
        noPadding
      >
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
      </SectionCard>
    );
  }

  return null;
};
