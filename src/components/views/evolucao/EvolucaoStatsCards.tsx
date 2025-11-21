import React from 'react';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface EvolucaoStatsCardsProps {
  dadosAtivos: any[];
  viewMode: 'mensal' | 'semanal';
  anoSelecionado: number;
}

export const EvolucaoStatsCards: React.FC<EvolucaoStatsCardsProps> = ({
  dadosAtivos,
  viewMode,
  anoSelecionado,
}) => {
  if (dadosAtivos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total de Corridas */}
      <div className="group relative rounded-2xl border-0 bg-gradient-to-br from-white via-white to-blue-50/30 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Total de Corridas
            </p>
            <p className="mt-3 text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
              {dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0).toLocaleString('pt-BR')}
            </p>
            <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
              {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} analisadas
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
            🚗
          </div>
        </div>
      </div>

      {/* Total de Horas */}
      <div className="group relative rounded-2xl border-0 bg-gradient-to-br from-white via-white to-blue-50/30 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Total de Horas
            </p>
            <p className="mt-3 text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
              {formatarHorasParaHMS(dadosAtivos.reduce((sum, d) => sum + d.total_segundos, 0) / 3600)}
            </p>
            <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
              Tempo total trabalhado
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
            ⏱️
          </div>
        </div>
      </div>

      {/* Média de Corridas */}
      <div className="group relative rounded-2xl border-0 bg-gradient-to-br from-white via-white to-blue-50/30 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Média {viewMode === 'mensal' ? 'Mensal' : 'Semanal'}
            </p>
            <p className="mt-3 text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
              {dadosAtivos.length > 0 ? (dadosAtivos.reduce((sum, d) => sum + ((d as any).corridas_completadas || (d as any).total_corridas || 0), 0) / dadosAtivos.length).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            </p>
            <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
              Corridas por período
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
            📊
          </div>
        </div>
      </div>

      {/* Período */}
      <div className="group relative rounded-2xl border-0 bg-gradient-to-br from-white via-white to-blue-50/30 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Período Analisado
            </p>
            <p className="mt-3 text-4xl font-black text-blue-900 dark:text-blue-100 tracking-tight">
              {anoSelecionado}
            </p>
            <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
              {dadosAtivos.length} {viewMode === 'mensal' ? 'meses' : 'semanas'} registradas
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-3xl shadow-lg group-hover:scale-110 transition-transform">
            📅
          </div>
        </div>
      </div>
    </div>
  );
};

