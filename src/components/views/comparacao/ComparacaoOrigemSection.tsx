import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe, FileSpreadsheet, BarChart2 } from 'lucide-react';
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
    <Card className="relative overflow-hidden border-none shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-rose-500/5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="relative z-10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-rose-600 rounded-2xl shadow-lg shadow-fuchsia-500/30">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Comparação por Origem
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Avalie corridas e aderência por origem entre as semanas
              </CardDescription>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl justify-center">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Tabela
            </button>
            <button
              onClick={() => onViewModeChange('chart')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${viewMode === 'chart'
                ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              <BarChart2 className="w-4 h-4" />
              Gráfico
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-0">
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

