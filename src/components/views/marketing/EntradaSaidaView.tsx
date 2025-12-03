import React, { useMemo } from 'react';
import { useEntradaSaidaData } from './useEntradaSaidaData';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { ArrowDownRight, ArrowUpRight, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId });

    const chartData = useMemo(() => {
        return {
            labels: data.map(d => format(parseISO(d.semana), 'dd/MM', { locale: ptBR })),
            datasets: [
                {
                    type: 'line' as const,
                    label: 'Saldo',
                    data: data.map(d => d.saldo),
                    borderColor: 'rgb(59, 130, 246)', // Blue-500
                    backgroundColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    tension: 0.3,
                    order: 0, // Render on top
                },
                {
                    type: 'bar' as const,
                    label: 'Entradas (Novos Ativos)',
                    data: data.map(d => d.entradas),
                    backgroundColor: 'rgba(34, 197, 94, 0.7)', // Emerald-500
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1,
                    order: 1,
                },
                {
                    type: 'bar' as const,
                    label: 'Saídas (Churn)',
                    data: data.map(d => d.saidas),
                    backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red-500
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1,
                    order: 1,
                },
            ],
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            entradas: acc.entradas + Number(curr.entradas),
            saidas: acc.saidas + Number(curr.saidas)
        }), { entradas: 0, saidas: 0 });
    }, [data]);

    const saldo = totals.entradas - totals.saidas;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <p>Erro: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Entradas</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totals.entradas}</p>
                        </div>
                        <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/30">
                            <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Novos entregadores ativos (&gt;30 rotas)</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Saídas</p>
                            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totals.saidas}</p>
                        </div>
                        <div className="rounded-full bg-rose-100 p-2 dark:bg-rose-900/30">
                            <ArrowDownRight className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Inativos há 7 dias (após ativação)</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo do Período</p>
                            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {saldo > 0 ? '+' : ''}{saldo}
                            </p>
                        </div>
                        <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-700">
                            <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Crescimento líquido da base ativa</p>
                </div>
            </div>

            {/* Gráfico */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Fluxo Semanal</h3>
                <div className="h-[400px] w-full">
                    <Bar data={chartData as any} options={options} />
                </div>
            </div>

            {/* Detalhamento Semanal (Cards) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Detalhamento Semanal</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...data].reverse().map((item) => (
                        <div key={item.semana} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {item.semana}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.saldo >= 0
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                    }`}>
                                    Saldo: {item.saldo > 0 ? '+' : ''}{item.saldo}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3">
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg">
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Entradas</p>
                                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{item.entradas}</p>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-900/10 p-2 rounded-lg">
                                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80">Saídas</p>
                                    <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{item.saidas}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
