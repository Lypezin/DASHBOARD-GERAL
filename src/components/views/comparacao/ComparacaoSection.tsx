import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';

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
  icon,
  description,
  type,
  dadosComparacao,
  semanasSelecionadas,
  viewMode,
  onViewModeChange,
}) => {
  if (type === 'dia') {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {icon}
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  {title}
                </CardTitle>
              </div>
              <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                {description}
              </CardDescription>
            </div>
            <div className="flex justify-center gap-2 sm:justify-end">
              <ViewToggleButton
                active={viewMode === 'table'}
                onClick={() => onViewModeChange('table')}
                label="Tabela"
              />
              <ViewToggleButton
                active={viewMode === 'chart'}
                onClick={() => onViewModeChange('chart')}
                label="Gráfico"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === 'table' ? (
            <ComparacaoDiaTable
              semanasSelecionadas={semanasSelecionadas}
              dadosComparacao={dadosComparacao}
            />
          ) : (
            <div className="p-6">
              <ComparacaoCharts
                dadosComparacao={dadosComparacao}
                semanasSelecionadas={semanasSelecionadas}
                viewMode={viewMode}
                chartType="dia"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Para sub-praça e origem, retornar null por enquanto (será implementado separadamente)
  return null;
};
