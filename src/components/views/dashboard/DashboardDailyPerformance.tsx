import React from 'react';
import { AderenciaDia } from '@/types';
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 pt-1">
            {aderenciaDiaOrdenada.map((dia, index) => (
                <DailyPerformanceCard
                    key={`dia-${index}`}
                    dia={dia}
                    index={index}
                />
            ))}
        </div>
    );
});

DashboardDailyPerformance.displayName = 'DashboardDailyPerformance';
