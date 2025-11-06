import React, { useState } from 'react';
import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import AderenciaCard from '../AderenciaCard';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Bar } from 'react-chartjs-2';

function DashboardView({
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
}: {
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
}) {
  const [viewMode, setViewMode] = useState<'turno' | 'sub_praca' | 'origem'>('turno');

  return (
    <div className="space-y-6">
      {aderenciaGeral && (
        <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-5 sm:p-6 lg:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 animate-slide-up">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/10"></div>
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shrink-0">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Aderência Geral</h2>
                  <p className="mt-0.5 sm:mt-1 text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                    {(aderenciaGeral.aderencia_percentual ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800/80 hover-lift">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">📅 Planejado</p>
                  <p className="mt-1 font-mono text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {formatarHorasParaHMS(aderenciaGeral.horas_a_entregar)}
                  </p>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/80 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-950/50 hover-lift">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400">⏱️ Entregue</p>
                  <p className="mt-1 font-mono text-sm sm:text-base lg:text-lg font-bold text-blue-900 dark:text-blue-100 truncate">
                    {formatarHorasParaHMS(aderenciaGeral.horas_entregues)}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex h-24 w-24 xl:h-32 xl:w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shrink-0">
              <span className="text-5xl xl:text-6xl">🎯</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {/* Destaques da Operação */}
        {/* Gráfico Aderência Diária */}
        {/* Aderência Detalhada */}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 p-4 sm:p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/50 dark:to-blue-950/10">
        {/* ... (conteúdo do gráfico de aderência diária) ... */}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* ... (conteúdo da seção de aderência detalhada) ... */}
      </div>
    </div>
  );
}

export default DashboardView;
