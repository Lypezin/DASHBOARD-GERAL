import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 transition-all duration-300">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

        <CardHeader className="relative z-10 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30 ring-1 ring-white/20 dark:ring-white/10 group-hover:scale-105 transition-transform duration-300">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                  Comparativo Semanal
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-medium font-sans">
                  Selecione as semanas para análise comparativa
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {semanasSelecionadas.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={onClearSemanas}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all duration-200 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar
                </motion.button>
              )}
              <button
                onClick={onMostrarApresentacao}
                disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
                className="group px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 ring-1 ring-white/20 dark:ring-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 active:scale-95"
                title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas para gerar a apresentação' : 'Gerar apresentação em PDF'}
              >
                <Presentation className="w-4 h-4" />
                <span className="hidden sm:inline">Apresentação</span>
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12 scale-50 group-hover:scale-100" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
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
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

