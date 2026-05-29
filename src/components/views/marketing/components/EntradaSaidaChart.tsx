import React from 'react';
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
import { useChartData } from './chart/useChartData';
import { useChartOptions } from './chart/useChartOptions';

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

interface EntradaSaidaChartProps {
    data: any[];
}

export const EntradaSaidaChart: React.FC<EntradaSaidaChartProps> = ({ data }) => {
    const chartData = useChartData(data);
    const options = useChartOptions();

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:border dark:border-slate-800 dark:shadow-none">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                            <BarChart3 className="h-5 w-5 text-sky-500" />
                            Evolucao Semanal
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Comparativo de entradas e saidas por semana
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="bg-white p-6 dark:bg-slate-900">
                <div className="h-[380px] w-full">
                    <Bar data={chartData as any} options={options as any} />
                </div>
            </CardContent>
        </Card>
    );
};
