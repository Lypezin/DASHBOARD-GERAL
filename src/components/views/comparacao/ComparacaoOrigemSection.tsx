import React from 'react';
import { DashboardResumoData } from '@/types';
import { ViewToggleButton } from '../ViewToggleButton';
import { ComparacaoCharts } from './ComparacaoCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { ComparacaoOrigemTable } from './ComparacaoOrigemTable';

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
  totalColunasOrigem,
}) => {
  if (origensDisponiveis.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Globe className="h-5 w-5 text-fuchsia-500" />
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Comparação por Origem
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
              Avalie corridas e aderência por origem entre as semanas selecionadas
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
      </CardContent>
    </Card>
  );
};
