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
    valueClassName = 'text-slate-700 dark:text-slate-200',
}) => {
    return (
        <TableRow className="group border-b border-transparent transition-all duration-200 hover:bg-slate-50/60 dark:hover:bg-slate-900/55">
            <TableCell className="py-4 pl-6 text-[13px] font-semibold text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-300 sm:pl-8 w-[280px]">
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
                        <TableCell className={`py-4 text-center font-mono text-[13px] ${valueClassName}`}>
                            <span>{formatValue(rawValue)}</span>
                        </TableCell>
                        {idx > 0 && (
                            <TableCell className="w-[72px] px-1 py-4 text-center">
                                {variacao !== null ? (
                                    <VariacaoBadge variacao={variacao} className="mx-auto scale-90" invertColors={invertVariationColors} />
                                ) : (
                                    <span className="font-mono text-xs text-slate-300 dark:text-slate-600">-</span>
                                )}
                            </TableCell>
                        )}
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
};
