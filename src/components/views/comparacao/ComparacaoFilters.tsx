import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';

interface ComparacaoFiltersProps {
  pracas: FilterOption[];
  todasSemanas: (number | string)[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  shouldDisablePracaFilter: boolean;
  onPracaChange: (praca: string | null) => void;
  onToggleSemana: (semana: number | string) => void;
  onClearSemanas: () => void;
  onMostrarApresentacao: () => void;
  loading: boolean;
  dadosComparacaoLength: number;
}

export const ComparacaoFilters: React.FC<ComparacaoFiltersProps> = ({
  pracas,
  todasSemanas,
  semanasSelecionadas,
  pracaSelecionada,
  shouldDisablePracaFilter,
  onPracaChange,
  onToggleSemana,
  onClearSemanas,
  onMostrarApresentacao,
  loading,
  dadosComparacaoLength,
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
               <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Configuração</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Defina os parâmetros da comparação
              </CardDescription>
            </div>
          </div>
           <div className="flex items-center gap-2">
             {semanasSelecionadas.length > 0 && (
              <button
                onClick={onClearSemanas}
                 className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-md transition-colors dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800"
              >
                Limpar filtros
              </button>
            )}
             <button
              onClick={onMostrarApresentacao}
              disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
            >
              Mode Apresentação
            </button>
           </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filtro de Praça - Mais compacto */}
          <div className="w-full lg:w-1/4">
            <FiltroSelect
              label="Praça"
              value={pracaSelecionada ?? ''}
              options={pracas}
              placeholder="Todas as praças"
              onChange={(value) => onPracaChange(value)}
              disabled={shouldDisablePracaFilter}
            />
          </div>

          {/* Seleção de Semanas - Ocupa o resto */}
          <div className="w-full lg:w-3/4">
             <ComparacaoWeekSelector
                todasSemanas={todasSemanas}
                semanasSelecionadas={semanasSelecionadas}
                onToggleSemana={onToggleSemana}
              />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
