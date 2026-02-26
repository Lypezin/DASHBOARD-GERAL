import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Search, Presentation, X, Sparkles } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                Comparativo Semanal
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selecione as semanas para análise comparativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {semanasSelecionadas.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onClearSemanas}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </motion.button>
            )}
            <button
              onClick={onMostrarApresentacao}
              disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
              className="group px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
            >
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">Apresentação</span>
              <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filtro de Praça */}
            <div className="w-full lg:w-1/4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Praça
                </label>
                <FiltroSelect
                  label=""
                  value={pracaSelecionada ?? ''}
                  options={pracas}
                  placeholder="Todas as praças"
                  onChange={(value) => onPracaChange(value)}
                  disabled={shouldDisablePracaFilter}
                />
              </div>
            </div>

            {/* Seleção de Semanas */}
            <div className="w-full lg:w-3/4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Semanas para Comparar
                  </label>
                  {semanasSelecionadas.length > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};
