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

export const ComparacaoDiaTable: React.FC<ComparacaoDiaTableProps> = ({
    semanasSelecionadas,
    dadosComparacao,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th rowSpan={2} className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 align-middle">
                            Dia
                        </th>
                        {semanasSelecionadas.map((semana, idx) => (
                            <th
                                key={`aderencia-${semana}`}
                                colSpan={idx === 0 ? 1 : 2}
                                className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                            >
                                Semana {semana}
                            </th>
                        ))}
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                        {semanasSelecionadas.map((semana, idx) =>
                            idx === 0 ? (
                                <th key={`aderencia-${semana}-valor`} className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Valor
                                </th>
                            ) : (
                                <React.Fragment key={`aderencia-${semana}`}>
                                    <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Valor
                                    </th>
                                    <th className="px-6 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Δ%
                                    </th>
                                </React.Fragment>
                            )
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {DIAS_DA_SEMANA.map((dia) => (
                        <tr key={dia} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 text-center font-medium text-slate-900 dark:text-white">{dia}</td>
                            {dadosComparacao.map((dados, idx) => {
                                const diaData = findDayData(dia, dados.aderencia_dia);
                                const aderencia = getMetricValue(diaData, 'aderencia_percentual');

                                let variacao = null;
                                if (idx > 0) {
                                    const dadosAnterior = dadosComparacao[idx - 1];
                                    const diaDataAnterior = findDayData(dia, dadosAnterior.aderencia_dia);
                                    const aderenciaAnterior = getMetricValue(diaDataAnterior, 'aderencia_percentual');
                                    variacao = calcularVariacaoPercentual(aderenciaAnterior, aderencia);
                                }

                                return (
                                    <React.Fragment key={idx}>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {aderencia.toFixed(1)}%
                                            </span>
                                        </td>
                                        {idx > 0 && variacao !== null && (
                                            <td className="px-6 py-4 text-center">
                                                <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" />
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
};
