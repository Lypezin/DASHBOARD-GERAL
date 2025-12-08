import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';

interface ComparingTableRowProps {
    label: string;
    icon: React.ReactNode;
    data: DashboardResumoData[];
    getValue: (item: DashboardResumoData) => number;
    formatValue: (value: number) => React.ReactNode;
    showVariation?: boolean;
    invertVariationColors?: boolean;
    valueClassName?: string;
}

export const ComparingTableRow: React.FC<ComparingTableRowProps> = ({
    label,
    icon,
    data,
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
            {data.map((dados, idx) => {
                const rawValue = getValue(dados);

                let variacao: number | null = null;

                if (idx > 0 && showVariation) {
                    const dadosAnterior = data[idx - 1];
                    const rawValueAnterior = getValue(dadosAnterior);

                    const currentNum = rawValue;
                    const prevNum = rawValueAnterior;

                    if (prevNum > 0) {
                        variacao = ((currentNum - prevNum) / prevNum) * 100;
                    } else if (currentNum > 0) {
                        variacao = 100;
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
