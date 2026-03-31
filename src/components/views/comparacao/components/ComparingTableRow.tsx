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
        <TableRow className="group transition-all duration-200 border-b border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <TableCell className="font-semibold text-[13px] text-slate-800 dark:text-slate-200 pl-8 py-5 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <div className="flex items-center gap-2">
                    {icon && icon}
                    {label}
                </div>
            </TableCell>

            {data.map((item, idx) => {
                const rawValue = getValue(item);
                let variacao: number | null = null;

                if (idx > 0 && showVariation) {
                    const prevValue = getValue(data[idx - 1]);
                    if (prevValue > 0) variacao = ((rawValue - prevValue) / prevValue) * 100;
                    else if (rawValue > 0) variacao = 100;
                    else variacao = 0;
                }

                return (
                    <React.Fragment key={idx}>
                        <TableCell className={`text-center text-[13px] font-mono py-5 ${valueClassName}`}>
                            <span>{formatValue(rawValue)}</span>
                        </TableCell>
                        {idx > 0 && (
                            <TableCell className="text-center w-[70px] py-5 px-1">
                                {variacao !== null ? (
                                    <VariacaoBadge variacao={variacao} className="scale-90 mx-auto" invertColors={invertVariationColors} />
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">-</span>
                                )}
                            </TableCell>
                        )}
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
};
