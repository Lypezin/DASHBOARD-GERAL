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
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/10 sm:p-16">
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                    Nenhum dado de &quot;Dia x Origem&quot; disponível para o período selecionado.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-full overflow-hidden group/table">
            <div className="max-h-[700px] max-w-full overflow-auto rounded-xl border border-slate-200 shadow-sm scrollbar-thin scrollbar-thumb-slate-300 dark:border-slate-800 dark:scrollbar-thumb-slate-700">
                <table className="w-max min-w-[1050px] border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-30 min-w-[240px] max-w-[280px] border-b border-r border-slate-200 bg-slate-50 px-6 py-4 text-left dark:border-slate-800 dark:bg-slate-900">
                                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                                    Origem / Restaurante
                                </span>
                            </th>
                            {DIAS_ORDEM.map(dia => (
                                <th key={dia} className="sticky top-0 z-20 min-w-[96px] border-b border-slate-200 bg-slate-50/95 px-4 py-3 text-center backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {dia}
                                        </span>
                                        {dayDateMap[dia.split('-')[0].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] && (
                                            <span className="text-[10px] font-medium text-blue-500/80 dark:text-blue-400/80 mt-0.5">
                                                ({dayDateMap[dia.split('-')[0].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")]})
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="sticky right-0 top-0 z-20 min-w-[128px] border-b border-slate-200 bg-slate-100/95 px-6 py-4 text-right font-black backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Total Semana
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {matrix.origens.map((origem) => {
                            let rowSum = 0;
                            return (
                                <tr key={origem} className="group/row hover:bg-slate-50/30 dark:hover:bg-white/[0.01] transition-all">
                                    <td className="sticky left-0 z-10 min-w-[240px] max-w-[280px] border-r border-slate-100 bg-white px-6 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors group-hover/row:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:group-hover/row:bg-slate-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[220px]" title={origem}>
                                                {origem}
                                            </span>
                                        </div>
                                    </td>
                                    {DIAS_ORDEM.map(dia => {
                                        const segundos = matrix.dataMap.get(origem)?.get(dia) || 0;
                                        rowSum += segundos;
                                        const heatmapClass = getHeatmapClass(segundos);
                                        
                                        return (
                                            <td key={dia} className={cn(
                                                "min-w-[96px] border-r border-slate-50 px-2 py-3 text-center transition-all duration-200 dark:border-slate-800/30",
                                                heatmapClass
                                            )}>
                                                {segundos > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold tabular-nums tracking-tight">
                                                            {formatarHorasParaHMS(segundos / 3600)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] opacity-20 font-light">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="sticky right-0 z-10 min-w-[128px] border-l border-slate-200 bg-slate-50/50 px-6 py-3 text-right backdrop-blur-sm transition-colors group-hover/row:bg-slate-100 dark:border-slate-700/50 dark:bg-slate-800/40 dark:group-hover/row:bg-slate-700/60">
                                        <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                            {formatarHorasParaHMS(rowSum / 3600)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-30">
                        <tr className="bg-slate-100 dark:bg-slate-800">
                            <td className="sticky left-0 z-40 min-w-[240px] max-w-[280px] border-r border-t border-slate-200 bg-slate-100 px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                Total por Dia
                            </td>
                            {DIAS_ORDEM.map(dia => (
                                <td key={dia} className="min-w-[96px] border-t border-slate-200 bg-slate-100 px-4 py-4 text-center dark:border-slate-700 dark:bg-slate-800">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                                        {formatarHorasParaHMS((columnTotals.get(dia) || 0) / 3600)}
                                    </span>
                                </td>
                            ))}
                            <td className="sticky right-0 z-40 min-w-[128px] border-t border-slate-200 bg-blue-600 px-6 py-4 text-right dark:border-slate-700 dark:bg-blue-500">
                                <span className="text-xs font-black text-white tabular-nums">
                                    {formatarHorasParaHMS(globalTotal / 3600)}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-start gap-3 px-2 sm:justify-end sm:gap-6">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legenda Volume:</span>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-100/40 dark:bg-blue-500/10 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-300/30 dark:bg-blue-500/30 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-400/50 dark:bg-blue-500/50 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-500/70 dark:bg-blue-500/70 rounded-sm" />
                        <div className="w-3 h-3 bg-blue-600/90 dark:bg-blue-500/90 rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
});
