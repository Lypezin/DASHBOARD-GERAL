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
  onComparar: () => void;
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
  onComparar,
  onMostrarApresentacao,
  loading,
  dadosComparacaoLength,
}) => {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-500" />
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Configurar Comparação</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Selecione a praça e as semanas para análise comparativa detalhada
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro de Praça */}
          <div>
            <FiltroSelect
              label="Praça"
              value={pracaSelecionada ?? ''}
              options={pracas}
              placeholder="Todas"
              onChange={(value) => onPracaChange(value)}
              disabled={shouldDisablePracaFilter}
            />
          </div>

          {/* Seleção de Semanas */}
          <ComparacaoWeekSelector
            todasSemanas={todasSemanas}
            semanasSelecionadas={semanasSelecionadas}
            onToggleSemana={onToggleSemana}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {semanasSelecionadas.length > 0 && (
              <span>
                {semanasSelecionadas.length} semana{semanasSelecionadas.length !== 1 ? 's' : ''} selecionada{semanasSelecionadas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {semanasSelecionadas.length > 0 && (
              <button
                onClick={onClearSemanas}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              >
                Limpar seleção
              </button>
            )}
            <button
              onClick={onComparar}
              disabled={semanasSelecionadas.length < 2 || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Comparando...' : 'Comparar Semanas'}
            </button>

            <button
              onClick={onMostrarApresentacao}
              disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
            >
              Apresentação
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
