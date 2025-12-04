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
    Filler,
} from 'chart.js';
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Activity, BarChart3, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId, praca }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca });

    const chartData = useMemo(() => {
        const sortedData = [...data].sort((a, b) => a.semana.localeCompare(b.semana));

        return {
            labels: sortedData.map(d => {
                const match = d.semana.match(/-W(\d+)$/);
                return match ? `Sem ${match[1]}` : d.semana;
            }),
            datasets: [
                {
                    type: 'line' as const,
                    label: 'Saldo',
                    data: sortedData.map(d => d.saldo),
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: true,
                    order: 0,
                    yAxisID: 'y',
                },
                {
                    type: 'bar' as const,
                    label: 'Entradas',
                    data: sortedData.map(d => d.entradas),
                    backgroundColor: 'rgba(16, 185, 129, 0.85)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
                    order: 1,
                    yAxisID: 'y',
                },
                {
                    type: 'bar' as const,
                    label: 'Saídas',
                    data: sortedData.map(d => -d.saidas),
                    backgroundColor: 'rgba(244, 63, 94, 0.85)',
                    borderColor: 'rgb(244, 63, 94)',
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
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
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 500,
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleFont: { size: 13, weight: 600 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            // Para Saídas, mostrar valor absoluto (pois plotamos negativo)
                            if (context.dataset.label === 'Saídas') {
                                label += Math.abs(context.parsed.y);
                            } else {
                                // Para Saldo e Entradas, mostrar valor real (pode ser negativo)
                                label += context.parsed.y;
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    font: { size: 11 },
                    color: 'rgb(148, 163, 184)',
                    padding: 8,
                    callback: function (value: any) {
                        return Math.abs(value);
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    font: { size: 11 },
                    color: 'rgb(148, 163, 184)',
                    padding: 8,
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
    const taxaCrescimento = totals.saidas > 0 ? ((totals.entradas / totals.saidas - 1) * 100).toFixed(1) : (totals.entradas > 0 ? 100 : 0);

    // Ordenar dados por semana (mais recente primeiro)
    const sortedWeeklyData = useMemo(() => {
        return [...data].sort((a, b) => b.semana.localeCompare(a.semana));
    }, [data]);

    const formatWeekLabel = (semana: string) => {
        const match = semana.match(/^(\d{4})-W(\d+)$/);
        if (match) {
            return `Semana ${match[2]}`;
        }
        return semana.replace(/^(\d{2})(\d{2})-W(\d+)$/, 'Semana $3');
    };

    if (loading) {
        return (
            <div className="flex h-80 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-indigo-100 dark:border-indigo-900"></div>
                        <div className="absolute top-0 left-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-indigo-600"></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 text-center shadow-sm dark:from-rose-950/20 dark:to-slate-900 dark:border-rose-900/50">
                <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-rose-100 flex items-center justify-center dark:bg-rose-900/40">
                    <Activity className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados</h3>
                <p className="mt-2 text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card Entradas */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <ArrowUpRight className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Entradas</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-white tracking-tight">{totals.entradas}</h3>
                            <p className="mt-1 text-sm text-emerald-100/80">Novos entregadores ativos</p>
                        </div>
                    </div>
                </div>

                {/* Card Saídas */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                <ArrowDownRight className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-rose-100 uppercase tracking-wider">Saídas</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-white tracking-tight">{totals.saidas}</h3>
                            <p className="mt-1 text-sm text-rose-100/80">Entregadores inativos</p>
                        </div>
                    </div>
                </div>

                {/* Card Saldo */}
                <div className={`group relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${saldo >= 0
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20 hover:shadow-indigo-500/30'
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20 hover:shadow-amber-500/30'
                    }`}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                {saldo >= 0 ? (
                                    <TrendingUp className="h-5 w-5 text-white" />
                                ) : (
                                    <TrendingDown className="h-5 w-5 text-white" />
                                )}
                            </div>
                            <span className={`text-xs font-medium uppercase tracking-wider ${saldo >= 0 ? 'text-indigo-100' : 'text-amber-100'
                                }`}>Saldo</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                {saldo > 0 ? '+' : ''}{saldo}
                            </h3>
                            <p className={`mt-1 text-sm ${saldo >= 0 ? 'text-indigo-100/80' : 'text-amber-100/80'}`}>
                                Crescimento líquido
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card Taxa */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-5 shadow-lg shadow-slate-800/20 transition-all duration-300 hover:shadow-xl hover:shadow-slate-800/30 hover:-translate-y-0.5 dark:from-slate-800 dark:to-slate-900">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5 blur-2xl"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between">
                            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Taxa</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                {Number(taxaCrescimento) > 0 ? '+' : ''}{taxaCrescimento}%
                            </h3>
                            <p className="mt-1 text-sm text-slate-300/80">Entradas vs Saídas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Semanais */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        Detalhamento por Semana
                    </h3>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {data.length} semanas
                    </Badge>
                </div>

                {sortedWeeklyData.length === 0 ? (
                    <div className="text-center py-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Calendar className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para o período selecionado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedWeeklyData.map((item, index) => (
                            <div
                                key={item.semana}
                                className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${index === 0
                                    ? 'border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-100 dark:shadow-none'
                                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                                    }`}
                            >
                                {index === 0 && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                )}

                                {/* Header do Card */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${index === 0
                                            ? 'bg-indigo-100 dark:bg-indigo-900/40'
                                            : 'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                            <Calendar className={`h-4 w-4 ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className={`font-semibold text-sm ${index === 0 ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-slate-100'
                                                }`}>
                                                {formatWeekLabel(item.semana)}
                                            </p>
                                        </div>
                                    </div>
                                    {index === 0 && (
                                        <Badge className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] px-2">
                                            Atual
                                        </Badge>
                                    )}
                                </div>

                                {/* Métricas */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                                        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600/70 dark:text-emerald-400/70 mb-1">Entradas</p>
                                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">+{item.entradas}</p>
                                    </div>
                                    <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-center">
                                        <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-600/70 dark:text-rose-400/70 mb-1">Saídas</p>
                                        <p className="text-xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">-{item.saidas}</p>
                                    </div>
                                </div>

                                {/* Saldo e Ações */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Badge
                                        className={`text-sm font-semibold px-3 py-1 border-0 tabular-nums ${item.saldo >= 0
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}
                                    >
                                        Saldo: {item.saldo > 0 ? '+' : ''}{item.saldo}
                                    </Badge>

                                    <div className="flex gap-1">
                                        {item.entradas > 0 && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                                            <ArrowUpRight className="h-5 w-5" />
                                                            Entradas - {formatWeekLabel(item.semana)}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            {item.entradas} novos entregadores ativos nesta semana.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                                                        <ul className="space-y-2">
                                                            {item.nomes_entradas.map((nome, idx) => (
                                                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                                                    <span className="truncate">{nome}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        {item.saidas > 0 && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                                                            <ArrowDownRight className="h-5 w-5" />
                                                            Saídas - {formatWeekLabel(item.semana)}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            {item.saidas} entregadores ficaram inativos nesta semana.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                                                        <ul className="space-y-2">
                                                            {item.nomes_saidas.map((nome, idx) => (
                                                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                                                                    <div className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                                                                    <span className="truncate">{nome}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gráfico (Agora no final) */}
            <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-none dark:border dark:border-slate-800">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-indigo-500" />
                                Evolução Semanal
                            </CardTitle>
                            <CardDescription className="mt-1 text-slate-500">
                                Comparativo de entradas e saídas por semana
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
        </div>
    );
};
