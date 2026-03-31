import React, { useMemo } from 'react';
import { AderenciaDiaOrigem } from '@/types';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface AnaliseDiaOrigemTableProps {
    data: AderenciaDiaOrigem[];
}

export const AnaliseDiaOrigemTable = React.memo(function AnaliseDiaOrigemTable({
    data
}: AnaliseDiaOrigemTableProps) {
    // Processar dados para a matriz
    const matrixData = useMemo(() => {
        const diasSet = new Set<string>();
        const origensSet = new Set<string>();
        const map = new Map<string, number>();

        const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (Array.isArray(data) && data.length > 0) {
            if (IS_DEV) console.log('DEBUG: AnaliseDiaOrigemTable data:', data);

            data.forEach(item => {
                // Tenta múltiplas chaves comuns para dia e origem
                const dia = item.dia || item.dia_da_semana || item.dia_semana || item.data;
                const origem = item.origem || (item as any).nome_origem || 'N/D';
                const segundosRealizados = item.segundos_realizados || (item as any).horas_entregues_segundos || 0;

                if (dia) {
                    diasSet.add(String(dia));
                    origensSet.add(String(origem));
                    map.set(`${dia}|${origem}`, (map.get(`${dia}|${origem}`) || 0) + (Number(segundosRealizados) / 3600));
                }
            });
        } else if (IS_DEV) {
            console.warn('DEBUG: AnaliseDiaOrigemTable received empty or invalid data:', data);
        }

        // Ordenar dias
        const dias = Array.from(diasSet);
        const origens = Array.from(origensSet).sort();

        return { dias, origens, map };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-400 dark:text-slate-500 text-sm">
                    Nenhum dado disponível para este cruzamento.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/20 sticky left-0 z-10 backdrop-blur-sm">
                            Dia da Semana
                        </th>
                        {matrixData.origens.map(origem => (
                            <th key={origem} className="px-6 py-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                {origem}
                            </th>
                        ))}
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/20 sticky right-0 z-10 backdrop-blur-sm">
                            Total Dia
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {matrixData.dias.map(dia => {
                        let totalDia = 0;
                        return (
                            <tr key={dia} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 sticky left-0 z-10 group-hover:bg-slate-50 dark:group-hover:bg-[#1a1f2e] transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                                    {dia}
                                </td>
                                {matrixData.origens.map(origem => {
                                    const segundos = matrixData.map.get(`${dia}|${origem}`) || 0;
                                    totalDia += segundos;
                                    const horas = segundos / 3600;
                                    
                                    return (
                                        <td key={origem} className="px-6 py-4 text-center tabular-nums">
                                            {segundos > 0 ? (
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                    {formatarHorasParaHMS(horas)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300 dark:text-slate-700">-</span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-4 text-right tabular-nums font-bold text-slate-900 dark:text-white bg-slate-50/30 dark:bg-slate-900/30 sticky right-0 z-10 group-hover:bg-slate-50 dark:group-hover:bg-[#1e2536] transition-colors shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                                    {formatarHorasParaHMS(totalDia / 3600)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/40 font-bold border-t border-slate-200 dark:border-slate-700">
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                            Total Geral
                        </td>
                        {matrixData.origens.map(origem => {
                            const totalOrigem = matrixData.dias.reduce((acc, dia) => acc + (matrixData.map.get(`${dia}|${origem}`) || 0), 0);
                            return (
                                <td key={origem} className="px-6 py-4 text-center text-sm text-slate-900 dark:text-white tabular-nums">
                                    {formatarHorasParaHMS(totalOrigem / 3600)}
                                </td>
                            );
                        })}
                        <td className="px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400 sticky right-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                            {formatarHorasParaHMS(
                                Array.from(matrixData.map.values()).reduce((a, b) => a + b, 0) / 3600
                            )}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
});
