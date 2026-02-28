import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Presentation, X } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';
import { ComparacaoSectionSelector } from './components/ComparacaoSectionSelector';
import { SecoesVisiveis } from './hooks/useComparacaoFilters';
import { motion } from 'framer-motion';

interface ComparacaoFiltersProps {
  pracas: FilterOption[]; todasSemanas: (number | string)[]; semanasSelecionadas: string[];
  pracaSelecionada: string | null; shouldDisablePracaFilter: boolean;
  onPracaChange: (praca: string | null) => void; onToggleSemana: (semana: number | string) => void;
  onClearSemanas: () => void; onMostrarApresentacao: () => void; loading: boolean; dadosComparacaoLength: number;
  secoesVisiveis: SecoesVisiveis; onToggleSecao: (secao: keyof SecoesVisiveis) => void;
}

export const ComparacaoFilters: React.FC<ComparacaoFiltersProps> = ({
  pracas, todasSemanas, semanasSelecionadas, pracaSelecionada, shouldDisablePracaFilter,
  onPracaChange, onToggleSemana, onClearSemanas, onMostrarApresentacao,
  loading, dadosComparacaoLength, secoesVisiveis, onToggleSecao,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Comparativo Semanal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Selecione semanas para análise comparativa de performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ComparacaoSectionSelector
            secoesVisiveis={secoesVisiveis}
            onToggleSecao={onToggleSecao}
          />
          {semanasSelecionadas.length > 0 && (
            <button
              onClick={onClearSemanas}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
          <button
            onClick={onMostrarApresentacao}
            disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas' : 'Gerar apresentação'}
          >
            <Presentation className="w-4 h-4" />
            Apresentação
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="w-full lg:w-48 flex-shrink-0">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Praça
          </label>
          <FiltroSelect
            label=""
            value={pracaSelecionada ?? ''}
            options={pracas}
            placeholder="Todas"
            onChange={(value) => onPracaChange(value)}
            disabled={shouldDisablePracaFilter}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Semanas
            </label>
            {semanasSelecionadas.length > 0 && (
              <span className="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {semanasSelecionadas.length} selecionada{semanasSelecionadas.length > 1 ? 's' : ''}
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
    </motion.div>
  );
};
