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
            <div className="p-16 text-center bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                    Nenhum dado de &quot;Dia x Origem&quot; disponível para o período selecionado.
                </p>
            </div>
        );
    }

    return (
        <div className="relative group/table container-matrix">
            <div className="overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 max-h-[700px]">
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="sticky left-0 top-0 z-30 bg-slate-50 dark:bg-slate-900 px-6 py-4 text-left border-b border-r border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                                    Origem / Restaurante
                                </span>
                            </th>
                            {DIAS_ORDEM.map(dia => (
                                <th key={dia} className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 text-center border-b border-slate-200 dark:border-slate-800 transition-colors">
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
                            <th className="sticky right-0 top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md px-6 py-4 text-right border-b border-slate-200 dark:border-slate-700 font-black">
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
                                    <td className="sticky left-0 z-10 px-6 py-3 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-800/50 border-r border-slate-100 dark:border-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none">
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
                                                "px-2 py-3 text-center border-r border-slate-50 dark:border-slate-800/30 transition-all duration-200",
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
                                    <td className="sticky right-0 z-10 px-6 py-3 bg-slate-50/50 dark:bg-slate-800/40 group-hover/row:bg-slate-100 dark:group-hover/row:bg-slate-700/60 border-l border-slate-200 dark:border-slate-700/50 text-right backdrop-blur-sm transition-colors">
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
                            <td className="sticky left-0 z-40 px-6 py-4 bg-slate-100 dark:bg-slate-800 border-t border-r border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                                Total por Dia
                            </td>
                            {DIAS_ORDEM.map(dia => (
                                <td key={dia} className="px-4 py-4 text-center border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 min-w-[100px]">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                                        {formatarHorasParaHMS((columnTotals.get(dia) || 0) / 3600)}
                                    </span>
                                </td>
                            ))}
                            <td className="sticky right-0 z-40 px-6 py-4 bg-blue-600 dark:bg-blue-500 border-t border-slate-200 dark:border-slate-700 text-right">
                                <span className="text-xs font-black text-white tabular-nums">
                                    {formatarHorasParaHMS(globalTotal / 3600)}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div className="mt-4 flex items-center justify-end gap-6 px-2">
                <div className="flex items-center gap-2">
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
