import React from 'react';
import { TableCell } from "@/components/ui/table";
import { formatDuration } from '@/utils/formatters/timeUtils';
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
    opsColorClass = 'text-slate-600 dark:text-slate-400',
    mktColorClass = 'text-sky-600 dark:text-sky-300'
}) => {
    const total = opsValue + mktValue;

    const formatValue = (val: number) => {
        if (type === 'duration') return formatDuration(val);
        if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        return val.toLocaleString('pt-BR');
    };

    return (
        <>
            <TableCell className="border-l border-slate-100 py-4 align-middle text-right dark:border-slate-800">
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium ${opsColorClass}`}>
                        {formatValue(opsValue)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {calculatePercentage(opsValue, total)}
                    </span>
                </div>
            </TableCell>
            <TableCell className="py-4 align-middle text-right">
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold ${mktColorClass}`}>
                        {formatValue(mktValue)}
                    </span>
                    <span className="text-[10px] text-sky-500/70 dark:text-sky-300/70">
                        {calculatePercentage(mktValue, total)}
                    </span>
                </div>
            </TableCell>
        </>
    );
};
