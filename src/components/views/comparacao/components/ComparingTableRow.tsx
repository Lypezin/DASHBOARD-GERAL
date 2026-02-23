import React from 'react';
import { DashboardResumoData } from '@/types';
import { VariacaoBadge } from '@/components/VariacaoBadge';
import { TableRow, TableCell } from '@/components/ui/table';

interface ComparingTableRowProps {
    label: string;
    icon: React.ReactNode;
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
    valueClassName = "text-slate-600 dark:text-slate-400",
    isEven = false,
}) => {
    // Calculate max value for relative bars
    const values = data.map(getValue);
    const maxValue = Math.max(...values, 0);

    return (
        <TableRow className={`
            transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/60 group border-b border-slate-200/30 dark:border-slate-700/30
            ${!isEven ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white/70 dark:bg-slate-900/70'}
        `}>
            <TableCell className="font-semibold text-slate-800 dark:text-slate-200 py-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-md rounded-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                        {icon}
                    </div>
                    {label}
                </div>
            </TableCell>
            {data.map((dados, idx) => {
                const rawValue = getValue(dados);
                const percentage = maxValue > 0 ? (rawValue / maxValue) * 100 : 0;

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
                        <TableCell className={`text-center text-sm border-l border-slate-100 dark:border-slate-800/60 relative p-0 h-full align-middle`}>
                            <div className="relative w-full h-full py-4 px-2 flex flex-col items-center justify-center z-10">
                                <span className={`font-medium relative z-10 ${valueClassName}`}>
                                    {formatValue(rawValue)}
                                </span>
                            </div>
                        </TableCell>
                        {idx > 0 && (
                            <TableCell className="text-center w-[80px] p-0">
                                {variacao !== null ? (
                                    <div className="flex justify-center">
                                        <VariacaoBadge variacao={variacao} className="scale-90" invertColors={invertVariationColors} />
                                    </div>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                )}
                            </TableCell>
                        )}
                    </React.Fragment>
                );
            })}
        </TableRow>
    );
};
