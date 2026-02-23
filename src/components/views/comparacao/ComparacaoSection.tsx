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
      <Card className="relative overflow-hidden border-none shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl h-full ring-1 ring-slate-200/50 dark:ring-slate-800/50 transition-all duration-300">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-50 pointer-events-none" />

        <CardHeader className="relative z-10 pb-6">
          <div className="flex flex-col gap-4 items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/30 ring-1 ring-white/20 dark:ring-white/10 group-hover:scale-105 transition-transform duration-300">
                {icon}
              </div>
              <div className="text-center">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                  {title}
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium font-sans">
                  {description}
                </CardDescription>
              </div>
            </div>

            <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 backdrop-blur-md">
              <button
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Tabela
              </button>
              <button
                onClick={() => onViewModeChange('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${viewMode === 'chart'
                  ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
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

