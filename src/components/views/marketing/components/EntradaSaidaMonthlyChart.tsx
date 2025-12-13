import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler,
} from 'chart.js';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { processMonthlyData, createChartData, getChartOptions } from './utils/chartUtils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

interface EntradaSaidaMonthlyChartProps {
    data: any[];
}

export const EntradaSaidaMonthlyChart: React.FC<EntradaSaidaMonthlyChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const sortedData = processMonthlyData(data);
        return createChartData(sortedData);
    }, [data]);

    // Use usage of useMemo for options if needed, but since it's static we can just call it
    // Or if we want to ensure referential stability:
    const options = useMemo(() => getChartOptions(), []);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Evolução Mensal
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Comparativo de entradas e saídas por mês
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-900">
                <div className="h-[380px] w-full">
                    <Bar data={chartData as any} options={options as any} />
                </div>
            </CardContent>
        </Card>
    );
};
