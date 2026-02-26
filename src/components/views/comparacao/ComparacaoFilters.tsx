import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Presentation, X, Sparkles, ChevronDown } from 'lucide-react';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
        {/* Compact header + actions */}
        <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left: Title + Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Comparativo Semanal
              </h2>
            </div>
            {semanasSelecionadas.length > 0 && (
              <span className="tabular-nums text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {semanasSelecionadas.length} semana{semanasSelecionadas.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Center: Filters inline */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
            <div className="w-full sm:w-48 flex-shrink-0">
              <FiltroSelect
                label=""
                value={pracaSelecionada ?? ''}
                options={pracas}
                placeholder="Todas as praças"
                onChange={(value) => onPracaChange(value)}
                disabled={shouldDisablePracaFilter}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ComparacaoWeekSelector
                todasSemanas={todasSemanas}
                semanasSelecionadas={semanasSelecionadas}
                onToggleSemana={onToggleSemana}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {semanasSelecionadas.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onClearSemanas}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </motion.button>
            )}
            <button
              onClick={onMostrarApresentacao}
              disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
              className="group px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas' : 'Gerar apresentação'}
            >
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">Apresentação</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
