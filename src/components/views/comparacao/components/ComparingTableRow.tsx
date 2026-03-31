import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { TableRow, TableCell } from '@/components/ui/table';

interface ComparingTableRowProps {
    label: string;
    icon?: React.ReactNode;
    data: DashboardResumoData[];
    getValue: (item: DashboardResumoData) => number;
    formatValue: (value: number) => React.ReactNode;
    showVariation?: boolean;
    invertVariationColors?: boolean;
    valueClassName?: string;
    isEven?: boolean;
}

export const ComparingTableRow: React.FC<ComparingTableRowProps> = ({
    label,
    icon,
    data,
    getValue,
    formatValue,
    showVariation = true,
    invertVariationColors = false,
    valueClassName = "text-slate-700 dark:text-slate-200",
    isEven = false,
}) => {
    return (
        <TableRow className={`
            group transition-all duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10
            ${isEven ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''}
        `}>
            <TableCell className="text-sm font-semibold text-slate-700 dark:text-slate-300 py-4 pl-6 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                <div className="flex items-center gap-2">
                    {icon && icon}
                    {label}
                </div>
            </TableCell>
            {data.map((dados, idx) => {
                const rawValue = getValue(dados);
                let variacao: number | null = null;

                if (idx > 0 && showVariation) {
                    const prevValue = getValue(data[idx - 1]);
                    if (prevValue > 0) variacao = ((rawValue - prevValue) / prevValue) * 100;
                    else if (rawValue > 0) variacao = 100;
                    else variacao = 0;
                }

                return (
                    <React.Fragment key={idx}>
                        <TableCell className={`text-center text-sm border-l border-slate-200/40 dark:border-slate-800/40 py-4 ${valueClassName}`}>
                            <span className="font-mono">{formatValue(rawValue)}</span>
                        </TableCell>
                        {idx > 0 && (
                            <TableCell className="text-center w-[70px] py-4 px-1">
                                {variacao !== null ? (
                                    <VariacaoBadge variacao={variacao} className="scale-90 mx-auto" invertColors={invertVariationColors} />
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-700">–</span>
                                )}
                            </TableCell>
                        )}
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
};
