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
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center sm:p-14">
        <p className="text-sm font-semibold text-muted-foreground/60">
          Nenhum dado de &quot;Dia x Origem&quot; disponível para o período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      <div className="subtle-scrollbar max-h-[700px] max-w-full overflow-auto rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <table className="w-max min-w-[1020px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[220px] max-w-[280px] border-b border-r border-border bg-muted px-5 py-4 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  Origem / Restaurante
                </span>
              </th>
              {DIAS_ORDEM.map((dia) => {
                const dayKey = dia.split('-')[0].trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const dateLabel = dayDateMap[dayKey];

                return (
                  <th key={dia} className="sticky top-0 z-20 min-w-[92px] border-b border-border bg-muted/95 px-4 py-3 text-center backdrop-blur transition-colors">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-foreground">
                        {dia}
                      </span>
                      {dateLabel ? (
                        <span className="mt-0.5 text-[10px] font-bold text-primary">
                          ({dateLabel})
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
              <th className="sticky right-0 top-0 z-20 min-w-[124px] border-b border-border bg-muted/95 px-5 py-4 text-right font-bold backdrop-blur">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  Total semana
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {matrix.origens.map((origem) => {
              let rowSum = 0;

              return (
                <tr key={origem} className="group/row transition-colors hover:bg-muted/30">
                  <td className="sticky left-0 z-10 min-w-[220px] max-w-[280px] border-r border-border bg-card px-5 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] transition-colors group-hover/row:bg-muted/40 dark:shadow-none">
                    <span className="block max-w-[220px] truncate text-sm font-bold text-foreground" title={origem}>
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
                          'min-w-[92px] border-r border-border/20 px-2 py-3 text-center transition-all duration-200',
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

                  <td className="sticky right-0 z-10 min-w-[124px] border-l border-border bg-muted/30 px-5 py-3 text-right backdrop-blur transition-colors group-hover/row:bg-muted/50">
                    <span className="text-xs font-black text-foreground tabular-nums">
                      {formatarHorasParaHMS(rowSum / 3600)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-30">
            <tr className="bg-muted border-t border-border">
              <td className="sticky left-0 z-40 min-w-[220px] max-w-[280px] border-r border-border bg-muted px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Total por dia
              </td>
              {DIAS_ORDEM.map((dia) => (
                <td key={dia} className="min-w-[92px] bg-muted px-4 py-4 text-center">
                  <span className="text-[11px] font-bold text-foreground tabular-nums">
                    {formatarHorasParaHMS((columnTotals.get(dia) || 0) / 3600)}
                  </span>
                </td>
              ))}
              <td className="sticky right-0 z-40 min-w-[124px] bg-primary px-5 py-4 text-right">
                <span className="text-xs font-black text-primary-foreground tabular-nums">
                  {formatarHorasParaHMS(globalTotal / 3600)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 px-1 sm:justify-end sm:gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
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
