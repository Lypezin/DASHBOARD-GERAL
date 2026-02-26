import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { Globe } from 'lucide-react';
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
      description="Avalie corridas e aderência por origem entre as semanas"
      icon={<Globe className="h-5 w-5" />}
      iconColor="text-rose-600 dark:text-rose-400"
      actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />}
      noPadding
    >
      {viewMode === 'table' ? (
        <ComparacaoOrigemTable
          semanasSelecionadas={semanasSelecionadas}
          dadosComparacao={dadosComparacao}
        />
      ) : (
        <div className="p-6">
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
