'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface OrigemBreakdownRow {
  origem: string;
  corridas_ofertadas: number;
  corridas_aceitas: number;
  corridas_rejeitadas: number;
  corridas_completadas: number;
  segundos_realizados: number;
  aderencia_percentual: number;
  rejeicao_percentual: number;
  completude_percentual: number;
}

interface EntregadorOrigemBreakdownProps {
  origemBreakdown: OrigemBreakdownRow[];
  origemLoading: boolean;
}

export const EntregadorOrigemBreakdown = React.memo(function EntregadorOrigemBreakdown({
  origemBreakdown,
  origemLoading,
}: EntregadorOrigemBreakdownProps) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_24px_-18px_rgba(37,99,235,0.8)]">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">Performance por origem</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Horas e corridas separadas por restaurante/origem</p>
          </div>
        </div>
        {origemLoading ? <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Carregando...</span> : null}
      </div>

      {origemBreakdown.length > 0 ? (
        <div className="subtle-scrollbar max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="grid min-w-[760px] grid-cols-[minmax(220px,1.5fr)_110px_90px_90px_90px_90px_90px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <span>Origem</span>
            <span className="text-right">Horas</span>
            <span className="text-right">Ofertadas</span>
            <span className="text-right">Aceitas</span>
            <span className="text-right">Rejeitadas</span>
            <span className="text-right">Concluídas</span>
            <span className="text-right">Aderência</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {origemBreakdown.map((row) => (
              <div key={row.origem} className="grid min-w-[760px] grid-cols-[minmax(220px,1.5fr)_110px_90px_90px_90px_90px_90px] gap-3 px-4 py-3 text-xs">
                <span className="min-w-0 truncate font-bold text-slate-800 dark:text-slate-100" title={row.origem}>{row.origem}</span>
                <span className="text-right font-mono text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(row.segundos_realizados / 3600)}</span>
                <span className="text-right tabular-nums text-slate-600 dark:text-slate-400">{row.corridas_ofertadas.toLocaleString('pt-BR')}</span>
                <span className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.corridas_aceitas.toLocaleString('pt-BR')}</span>
                <span className="text-right tabular-nums text-rose-600 dark:text-rose-400">{row.corridas_rejeitadas.toLocaleString('pt-BR')}</span>
                <span className="text-right tabular-nums text-sky-600 dark:text-sky-300">{row.corridas_completadas.toLocaleString('pt-BR')}</span>
                <span className="text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{row.aderencia_percentual.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-4 text-center text-xs text-slate-500 dark:border-blue-900/60 dark:bg-slate-950/40 dark:text-slate-400">
          {origemLoading ? 'Carregando origens...' : 'Nenhum detalhamento por origem encontrado para o filtro atual.'}
        </div>
      )}
    </div>
  );
});
