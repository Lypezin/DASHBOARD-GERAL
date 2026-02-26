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
            transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50
            ${isEven ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}
        `}>
            <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300 py-3 pl-5">
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
                        <TableCell className={`text-center text-sm border-l border-slate-100 dark:border-slate-800 py-3 ${valueClassName}`}>
                            {formatValue(rawValue)}
                        </TableCell>
                        {idx > 0 && (
                            <TableCell className="text-center w-[70px] py-3 px-1">
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
