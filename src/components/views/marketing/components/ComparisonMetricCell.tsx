import React from 'react';
import { TableCell } from "@/components/ui/table";
import { formatDuration } from '@/utils/timeHelpers';
import { calculatePercentage } from '@/utils/formatHelpers';

interface ComparisonMetricCellProps {
    opsValue: number;
    mktValue: number;
    type?: 'number' | 'currency' | 'duration';
    opsColorClass?: string;
    mktColorClass?: string;
}

export const ComparisonMetricCell: React.FC<ComparisonMetricCellProps> = ({
    opsValue = 0,
    mktValue = 0,
    type = 'number',
    opsColorClass = "text-slate-600 dark:text-slate-400",
    mktColorClass = "text-purple-600 dark:text-purple-400"
}) => {
    const total = opsValue + mktValue;

    const formatValue = (val: number) => {
        if (type === 'duration') return formatDuration(val);
        if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        return val.toLocaleString('pt-BR');
    };

    return (
        <>
            <TableCell className="text-right border-l border-slate-100 dark:border-slate-800 align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className={`font-medium ${opsColorClass} text-xs`}>
                        {formatValue(opsValue)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {calculatePercentage(opsValue, total)}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-right align-middle py-4">
                <div className="flex flex-col items-end gap-1">
                    <span className={`font-semibold ${mktColorClass} text-xs`}>
                        {formatValue(mktValue)}
                    </span>
                    <span className="text-[10px] text-purple-500/70">
                        {calculatePercentage(mktValue, total)}
                    </span>
                </div>
            </TableCell>
        </>
    );
};
