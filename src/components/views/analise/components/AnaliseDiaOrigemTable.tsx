'use client';

import React from 'react';
import { AderenciaDiaOrigem } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useDiaOrigemMatrix, DIAS_ORDEM } from '../hooks/useDiaOrigemMatrix';

interface AnaliseDiaOrigemTableProps {
  data: AderenciaDiaOrigem[];
  dayDateMap?: Record<string, string>;
}

export const AnaliseDiaOrigemTable = React.memo(function AnaliseDiaOrigemTable({
  data,
  dayDateMap = {}
}: AnaliseDiaOrigemTableProps) {
  const { matrix, columnTotals, globalTotal, getHeatmapClass } = useDiaOrigemMatrix(data);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50 sm:p-14">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Nenhum dado de &quot;Dia x Origem&quot; disponivel para o periodo selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      <div className="subtle-scrollbar max-h-[700px] max-w-full overflow-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-950/60">
        <table className="w-max min-w-[1020px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[220px] max-w-[280px] border-b border-r border-slate-200 bg-slate-50 px-5 py-4 text-left dark:border-slate-800 dark:bg-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Origem / Restaurante
                </span>
              </th>
              {DIAS_ORDEM.map((dia) => {
                const dayKey = dia.split('-')[0].trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const dateLabel = dayDateMap[dayKey];

                return (
                  <th key={dia} className="sticky top-0 z-20 min-w-[92px] border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-center backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-950 dark:text-slate-50">
                        {dia}
                      </span>
                      {dateLabel ? (
                        <span className="mt-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                          ({dateLabel})
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
              <th className="sticky right-0 top-0 z-20 min-w-[124px] border-b border-slate-200 bg-slate-50/95 px-5 py-4 text-right font-bold backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total semana
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70">
            {matrix.origens.map((origem) => {
              let rowSum = 0;

              return (
                <tr key={origem} className="group/row transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/55">
                  <td className="sticky left-0 z-10 min-w-[220px] max-w-[280px] border-r border-slate-200 bg-white px-5 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] transition-colors group-hover/row:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:group-hover/row:bg-slate-900 dark:shadow-none">
                    <span className="block max-w-[220px] truncate text-sm font-bold text-slate-950 dark:text-slate-50" title={origem}>
                      {origem}
                    </span>
                  </td>

                  {DIAS_ORDEM.map((dia) => {
                    const segundos = matrix.dataMap.get(origem)?.get(dia) || 0;
                    rowSum += segundos;
                    const heatmapClass = getHeatmapClass(segundos);

                    return (
                      <td
                        key={dia}
                        className={cn(
                          'min-w-[92px] border-r border-slate-200/60 px-2 py-3 text-center transition-all duration-200 dark:border-slate-800/70',
                          heatmapClass
                        )}
                      >
                        {segundos > 0 ? (
                          <span className="text-xs font-bold tracking-tight tabular-nums">
                            {formatarHorasParaHMS(segundos / 3600)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-light opacity-20">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="sticky right-0 z-10 min-w-[124px] border-l border-slate-200 bg-slate-50/90 px-5 py-3 text-right backdrop-blur transition-colors group-hover/row:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/90 dark:group-hover/row:bg-slate-900">
                    <span className="text-xs font-black text-slate-950 tabular-nums dark:text-slate-50">
                      {formatarHorasParaHMS(rowSum / 3600)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-30">
            <tr className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <td className="sticky left-0 z-40 min-w-[220px] max-w-[280px] border-r border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Total por dia
              </td>
              {DIAS_ORDEM.map((dia) => (
                <td key={dia} className="min-w-[92px] bg-slate-50 px-4 py-4 text-center dark:bg-slate-900">
                  <span className="text-[11px] font-bold text-slate-950 tabular-nums dark:text-slate-50">
                    {formatarHorasParaHMS((columnTotals.get(dia) || 0) / 3600)}
                  </span>
                </td>
              ))}
              <td className="sticky right-0 z-40 min-w-[124px] bg-blue-600 px-5 py-4 text-right">
                <span className="text-xs font-black text-white tabular-nums">
                  {formatarHorasParaHMS(globalTotal / 3600)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 px-1 sm:justify-end sm:gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Legenda volume
          </span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-blue-100/40 dark:bg-blue-500/10" />
            <div className="h-3 w-3 rounded-sm bg-blue-300/30 dark:bg-blue-500/30" />
            <div className="h-3 w-3 rounded-sm bg-blue-400/50 dark:bg-blue-500/50" />
            <div className="h-3 w-3 rounded-sm bg-blue-500/70 dark:bg-blue-500/70" />
            <div className="h-3 w-3 rounded-sm bg-blue-600/90 dark:bg-blue-500/90" />
          </div>
        </div>
      </div>
    </div>
  );
});

AnaliseDiaOrigemTable.displayName = 'AnaliseDiaOrigemTable';
