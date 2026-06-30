import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { calcularVariacaoPercentual } from '@/utils/comparacaoCalculations';
import { DIAS_DA_SEMANA } from '@/constants/comparacao';
import { findDayData, getMetricValue } from '@/utils/comparacaoHelpers';

interface ComparacaoDiaTableProps {
    semanasSelecionadas: string[];
    dadosComparacao: DashboardResumoData[];
}

export const ComparacaoDiaTable = React.memo(function ComparacaoDiaTable({
    semanasSelecionadas,
    dadosComparacao,
}: ComparacaoDiaTableProps) {
    const dayRows = React.useMemo(() => (
        DIAS_DA_SEMANA.map((dia) => ({
            dia,
            valores: dadosComparacao.map((dados) => {
                const diaData = findDayData(dia, dados?.aderencia_dia);
                return getMetricValue(diaData, 'aderencia_percentual');
            }),
        }))
    ), [dadosComparacao]);

    return (
        <div className="subtle-scrollbar overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[720px]">
                <thead className="bg-slate-50/90 dark:bg-slate-900/80">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th rowSpan={2} className="px-4 py-4 text-center align-middle text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:px-6">
                            Dia
                        </th>
                        {semanasSelecionadas.map((semana, idx) => (
                            <th
                                key={`aderencia-${semana}`}
                                colSpan={idx === 0 ? 1 : 2}
                                className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:px-6"
                            >
                                Semana {semana}
                            </th>
                        ))}
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        {semanasSelecionadas.map((semana, idx) =>
                            idx === 0 ? (
                                <th key={`aderencia-${semana}-valor`} className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:px-6">
                                    Valor
                                </th>
                            ) : (
                                <React.Fragment key={`aderencia-${semana}`}>
                                    <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:px-6">
                                        Valor
                                    </th>
                                    <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 sm:px-6">
                                        Var %
                                    </th>
                                </React.Fragment>
                            )
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dayRows.map(({ dia, valores }) => (
                        <tr key={dia} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-4 text-center font-semibold text-slate-900 dark:text-white sm:px-6">{dia}</td>
                            {valores.map((aderencia, idx) => {

                                let variacao = null;
                                if (idx > 0) {
                                    const aderenciaAnterior = valores[idx - 1];
                                    variacao = calcularVariacaoPercentual(aderenciaAnterior, aderencia);
                                }

                                return (
                                    <React.Fragment key={idx}>
                                        <td className="px-4 py-4 text-center sm:px-6">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {aderencia.toFixed(1)}%
                                            </span>
                                        </td>
                                        {idx > 0 && (
                                            <td className="px-4 py-4 text-center sm:px-6">
                                                {variacao !== null ? (
                                                    <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                                )}
                                            </td>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

ComparacaoDiaTable.displayName = 'ComparacaoDiaTable';
