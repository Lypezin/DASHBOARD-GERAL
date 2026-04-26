import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Presentation, X } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';
import { ComparacaoSectionSelector } from './components/ComparacaoSectionSelector';
import { SecoesVisiveis } from './hooks/useComparacaoFilters';

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
  secoesVisiveis: SecoesVisiveis;
  onToggleSecao: (secao: keyof SecoesVisiveis) => void;
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
  dadosComparacaoLength,
  secoesVisiveis,
  onToggleSecao
}) => {
  return (
    <div className="space-y-6 mb-10 animate-fade-in">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Comparativo <span className="text-indigo-600 dark:text-indigo-400">Semanal</span>
          </h1>
          <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            Análise bi-semanal de performance e crescimento
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ComparacaoSectionSelector secoesVisiveis={secoesVisiveis} onToggleSecao={onToggleSecao} />
          {semanasSelecionadas.length > 0 && (
            <button
              onClick={onClearSemanas}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 rounded-full transition-[background-color,color] duration-150 flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
          <button
            onClick={onMostrarApresentacao}
            disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-[1.01] active:scale-[0.99] rounded-full shadow-md shadow-slate-900/10 dark:shadow-white/5 transition-[background-color,color,box-shadow,transform,opacity] duration-150 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2"
            title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas' : 'Gerar apresentação'}
          >
            <Presentation className="w-4 h-4" />
            Apresentação
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-transparent dark:border-slate-800/50">
        <div className="w-full lg:w-56 flex-shrink-0">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
            Praça Selecionada
          </label>
          <FiltroSelect
            label=""
            value={pracaSelecionada ?? ''}
            options={pracas}
            placeholder="Todas as Praças"
            onChange={(value) => onPracaChange(value)}
            disabled={shouldDisablePracaFilter}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Janelas de Tempo (Semanas)
            </label>
            {semanasSelecionadas.length > 0 && (
              <span className="text-[10px] font-bold tabular-nums text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                {semanasSelecionadas.length} / 2 Ativas
              </span>
            )}
          </div>
          <ComparacaoWeekSelector
            todasSemanas={todasSemanas}
            semanasSelecionadas={semanasSelecionadas}
            onToggleSemana={onToggleSemana}
          />
        </div>
      </div>
    </div>
  );
};
