import React from 'react';
import { AderenciaDia } from '@/types';
import { CalendarDays } from 'lucide-react';
import { useDailyPerformanceData } from './hooks/useDailyPerformanceData';
import { DailyPerformanceCard } from './components/DailyPerformanceCard';

interface DashboardDailyPerformanceProps {
    aderenciaDia: AderenciaDia[];
}

export const DashboardDailyPerformance = React.memo(function DashboardDailyPerformance({
    aderenciaDia,
}: DashboardDailyPerformanceProps) {
    const aderenciaDiaOrdenada = useDailyPerformanceData(aderenciaDia);

    if (aderenciaDiaOrdenada.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200 sm:text-lg">
                    <CalendarDays className="h-5 w-5 text-slate-500" />
                    Performance diária
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                {aderenciaDiaOrdenada.map((dia, index) => (
                    <DailyPerformanceCard
                        key={`dia-${index}`}
                        dia={dia}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
});
