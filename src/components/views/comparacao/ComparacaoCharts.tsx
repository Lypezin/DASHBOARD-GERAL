import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoChartDetalhada } from './ComparacaoChartDetalhada';
import { ComparacaoChartDia } from './ComparacaoChartDia';
import { ComparacaoChartSubPraca } from './ComparacaoChartSubPraca';
import { ComparacaoChartOrigem } from './ComparacaoChartOrigem';

interface ComparacaoChartsProps {
  dadosComparacao: DashboardResumoData[];
  semanasSelecionadas: string[];
  viewMode: 'table' | 'chart';
  chartType: 'detalhada' | 'dia' | 'subPraca' | 'origem';
  origensDisponiveis?: string[];
}

export const ComparacaoCharts: React.FC<ComparacaoChartsProps> = ({
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  chartType,
  origensDisponiveis = [],
}) => {
  if (viewMode !== 'chart') return null;

  if (chartType === 'detalhada') {
    return <ComparacaoChartDetalhada dadosComparacao={dadosComparacao} semanasSelecionadas={semanasSelecionadas} />;
  }

  if (chartType === 'dia') {
    return <ComparacaoChartDia dadosComparacao={dadosComparacao} semanasSelecionadas={semanasSelecionadas} />;
  }

  if (chartType === 'subPraca') {
    return <ComparacaoChartSubPraca dadosComparacao={dadosComparacao} semanasSelecionadas={semanasSelecionadas} />;
  }

  if (chartType === 'origem') {
    return (
      <ComparacaoChartOrigem
        dadosComparacao={dadosComparacao}
        semanasSelecionadas={semanasSelecionadas}
        origensDisponiveis={origensDisponiveis}
      />
    );
  }

  return null;
};
