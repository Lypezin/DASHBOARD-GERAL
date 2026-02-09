import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, FileSpreadsheet, BarChart2 } from 'lucide-react';
import { ComparacaoSubPracaTable } from './ComparacaoSubPracaTable';

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
    <Card className="relative overflow-hidden border-none shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl h-full">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="relative z-10 pb-6">
        <div className="flex flex-col gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="text-center">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Por Sub-Praça
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
                Análise por região
              </CardDescription>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Tabela
            </button>
            <button
              onClick={() => onViewModeChange('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${viewMode === 'chart'
                ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Gráfico
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-0">
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
      </CardContent>
    </Card>
  );
};

