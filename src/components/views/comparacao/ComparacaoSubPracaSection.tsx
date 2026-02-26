import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { MapPin } from 'lucide-react';
import { ComparacaoSubPracaTable } from './ComparacaoSubPracaTable';
import { SectionCard } from './components/SectionCard';
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
    <SectionCard
      title="Por Sub-Praça"
      description="Análise por região"
      icon={<MapPin className="h-5 w-5" />}
      iconColor="text-purple-600 dark:text-purple-400"
      actions={<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} size="sm" />}
      noPadding
    >
      {viewMode === 'table' ? (
        <ComparacaoSubPracaTable
          dadosComparacao={dadosComparacao}
          semanasSelecionadas={semanasSelecionadas}
        />
      ) : (
        <div className="p-6">
          <ComparacaoCharts
            dadosComparacao={dadosComparacao}
            semanasSelecionadas={semanasSelecionadas}
            viewMode={viewMode}
            chartType="subPraca"
          />
        </div>
      )}
    </SectionCard>
  );
};
