import React from 'react';
import { DashboardResumoData } from '@/types';
import { ComparacaoCharts } from './ComparacaoCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComparacaoDiaTable } from './components/ComparacaoDiaTable';
import { FileSpreadsheet, BarChart2 } from 'lucide-react';

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
      <Card className="relative overflow-hidden border-none shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl h-full">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="relative z-10 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/20">
                {icon}
              </div>
              <div className="text-center sm:text-left">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {title}
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
                  {description}
                </CardDescription>
              </div>
            </div>

            <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl justify-center">
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

  return null;
};

