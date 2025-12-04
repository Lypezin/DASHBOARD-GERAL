import React from 'react';
import { DashboardResumoData, AderenciaSubPraca } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';

interface ComparacaoMetricRowProps {
    label: string;
    icon: React.ReactNode;
    dadosComparacao: DashboardResumoData[];
    subPraca: string;
    getValue: (subPracaData: AderenciaSubPraca) => number | string;
    formatValue: (value: number | string) => React.ReactNode;
    showVariation?: boolean;
    invertVariationColors?: boolean;
    valueClassName?: string;
}

export const ComparacaoMetricRow: React.FC<ComparacaoMetricRowProps> = ({
    label,
    icon,
    dadosComparacao,
    subPraca,
    getValue,
    formatValue,
    showVariation = true,
    invertVariationColors = false,
    valueClassName = "text-slate-600 dark:text-slate-400"
}) => {
    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                    {icon}
                    {label}
                </div>
            </td>
            {dadosComparacao.map((dados, idx) => {
                const subPracaData = (dados.aderencia_sub_praca || dados.sub_praca)?.find(sp => sp.sub_praca === subPraca);
                const rawValue = subPracaData ? getValue(subPracaData) : 0;

                let variacao: number | null = null;

                if (idx > 0 && showVariation) {
                    const dadosAnterior = dadosComparacao[idx - 1];
                    const subPracaDataAnterior = (dadosAnterior.aderencia_sub_praca || dadosAnterior.sub_praca)?.find(sp => sp.sub_praca === subPraca);
                    const rawValueAnterior = subPracaDataAnterior ? getValue(subPracaDataAnterior) : 0;

                    const currentNum = typeof rawValue === 'number' ? rawValue : 0;
                    const prevNum = typeof rawValueAnterior === 'number' ? rawValueAnterior : 0;

                    if (prevNum > 0) {
                        variacao = ((currentNum - prevNum) / prevNum) * 100;
                    } else if (currentNum > 0) {
                        variacao = 100; // De 0 para algo é 100% de aumento (ou infinito, mas 100 é uma representação comum)
                    } else {
                        variacao = 0;
                    }
                }

                return (
                    <React.Fragment key={idx}>
                        <td className={`px-6 py-4 text-center text-sm border-l border-slate-200 dark:border-slate-700 ${valueClassName}`}>
                            {formatValue(rawValue)}
                        </td>
                        {idx > 0 && (
                            <td className="px-4 py-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                {variacao !== null ? (
                                    <VariacaoBadge variacao={variacao} className="px-2 py-0.5 text-xs" invertColors={invertVariationColors} />
                                ) : null}
                            </td>
                        )}
                    </React.Fragment>
                );
            })}
        </tr>
    );
};
