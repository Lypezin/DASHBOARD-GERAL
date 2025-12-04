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
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import { ArrowDownRight, ArrowUpRight, Users, TrendingUp, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EntradaSaidaTable } from './EntradaSaidaTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    ChartTooltip,
    Legend
);

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId, praca }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca });

    const chartData = useMemo(() => {
        // Ordenar dados cronologicamente para o gráfico
        const sortedData = [...data].sort((a, b) => a.semana.localeCompare(b.semana));

        return {
            labels: sortedData.map(d => {
                // Formatar label da semana (ex: 2025-W01 -> Sem 01)
                const match = d.semana.match(/-W(\d+)$/);
                return match ? `Sem ${match[1]}` : d.semana;
            }),
            datasets: [
                {
                    type: 'line' as const,
                    label: 'Saldo Líquido',
                    data: sortedData.map(d => d.saldo),
                    borderColor: 'rgb(59, 130, 246)', // Blue-500
                    backgroundColor: 'rgb(59, 130, 246)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    order: 0, // Render on top
                    yAxisID: 'y',
                },
                {
                    type: 'bar' as const,
                    label: 'Entradas',
                    data: sortedData.map(d => d.entradas),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)', // Emerald-500
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 0,
                    borderRadius: 4,
                    order: 1,
                    yAxisID: 'y',
                },
                {
                    type: 'bar' as const,
                    label: 'Saídas',
                    data: sortedData.map(d => -d.saidas), // Negativo para mostrar abaixo do eixo
                    backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red-500
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 0,
                    borderRadius: 4,
                    order: 1,
                    yAxisID: 'y',
                },
            ],
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            // Mostrar valor absoluto para saídas no tooltip
                            label += Math.abs(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    callback: function (value: any) {
                        return Math.abs(value); // Mostrar valores positivos no eixo Y
                    }
                }
            },
            x: {
                grid: {
                    display: false
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
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <p className="text-sm text-slate-500 animate-pulse">Carregando dados de fluxo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:bg-rose-900/20 dark:border-rose-900">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center dark:bg-rose-900/40">
                    <Activity className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados</h3>
                <p className="mt-1 text-rose-700 dark:text-rose-300">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Cards de Resumo com Design Premium */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Card Entradas */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-sm transition-all hover:shadow-md dark:border-emerald-900 dark:from-slate-900 dark:to-emerald-900/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Total Entradas</p>
                            <h3 className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-400">{totals.entradas}</h3>
                            <p className="mt-1 text-xs text-emerald-600/60 dark:text-emerald-500/60">Novos ativos no período</p>
                        </div>
                        <div className="rounded-xl bg-emerald-100/80 p-3 dark:bg-emerald-900/40">
                            <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Card Saídas */}
                <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-6 shadow-sm transition-all hover:shadow-md dark:border-rose-900 dark:from-slate-900 dark:to-rose-900/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider">Total Saídas</p>
                            <h3 className="mt-2 text-3xl font-bold text-rose-700 dark:text-rose-400">{totals.saidas}</h3>
                            <p className="mt-1 text-xs text-rose-600/60 dark:text-rose-500/60">Churn (inativos) no período</p>
                        </div>
                        <div className="rounded-xl bg-rose-100/80 p-3 dark:bg-rose-900/40">
                            <ArrowDownRight className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                </div>

                {/* Card Saldo */}
                <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-md ${saldo >= 0
                        ? 'border-blue-100 from-white to-blue-50/50 dark:border-blue-900 dark:from-slate-900 dark:to-blue-900/10'
                        : 'border-orange-100 from-white to-orange-50/50 dark:border-orange-900 dark:from-slate-900 dark:to-orange-900/10'
                    }`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className={`text-sm font-medium uppercase tracking-wider ${saldo >= 0 ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-orange-600/80 dark:text-orange-400/80'
                                }`}>Saldo Líquido</p>
                            <h3 className={`mt-2 text-3xl font-bold ${saldo >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'
                                }`}>
                                {saldo > 0 ? '+' : ''}{saldo}
                            </h3>
                            <p className={`mt-1 text-xs ${saldo >= 0 ? 'text-blue-600/60 dark:text-blue-500/60' : 'text-orange-600/60 dark:text-orange-500/60'
                                }`}>Crescimento da base</p>
                        </div>
                        <div className={`rounded-xl p-3 ${saldo >= 0 ? 'bg-blue-100/80 dark:bg-blue-900/40' : 'bg-orange-100/80 dark:bg-orange-900/40'
                            }`}>
                            {saldo >= 0 ? (
                                <TrendingUp className={`h-6 w-6 ${saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
                            ) : (
                                <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfico de Fluxo */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-slate-500" />
                        Evolução do Fluxo
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[350px] w-full">
                        <Bar data={chartData as any} options={options as any} />
                    </div>
                </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <EntradaSaidaTable data={data} />
        </div>
    );
};
