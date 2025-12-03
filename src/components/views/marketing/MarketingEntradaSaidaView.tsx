import React from 'react';
import { useMarketingData } from './useMarketingData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/useAuth';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const {
        loading,
        error,
        filters,
        handleFilterChange
    } = useMarketingData();

    const { user } = useAuth();
    const [selectedWeek, setSelectedWeek] = React.useState<string | null>(null);

    // Gerar últimas 12 semanas com datas e labels amigáveis
    const weeks = React.useMemo(() => {
        const result = [];
        const today = new Date();

        for (let i = 0; i < 12; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - (i * 7));

            // Get ISO week number
            const target = new Date(d.valueOf());
            const dayNr = (d.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNr + 3);
            const firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
                target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
            const year = d.getFullYear();

            // Calculate Start (Monday) and End (Sunday) dates
            const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
            const dayOfWeek = simple.getDay();
            const isoWeekStart = simple;
            if (dayOfWeek <= 4)
                isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else
                isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());

            const start = new Date(isoWeekStart);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);

            // Format label: "S47 (17/11 - 23/11)"
            const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            result.push({
                id: `${year}-W${weekNumber}`,
                label: `Semana ${weekNumber}`,
                subLabel: `${startStr} - ${endStr}`,
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            });
        }
        return result;
    }, []);

    const handleWeekSelect = (weekId: string | null, start: string, end: string) => {
        if (!weekId) {
            setSelectedWeek(null);
            handleFilterChange('filtroDataInicio', { dataInicial: null, dataFinal: null });
            return;
        }

        setSelectedWeek(weekId);
        handleFilterChange('filtroDataInicio', {
            dataInicial: start,
            dataFinal: end
        });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                    <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
                    <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Filtros de Data - Apenas Data Início */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-200">
                            Filtros de Data
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                    {/* Filtro de Semanas */}
                    <div className="w-full sm:w-72">
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filtrar por Semana
                        </label>
                        <Select
                            value={selectedWeek || "all"}
                            onValueChange={(value) => {
                                if (value === "all") {
                                    handleWeekSelect(null, '', '');
                                } else {
                                    const week = weeks.find(w => w.id === value);
                                    if (week) {
                                        handleWeekSelect(week.id, week.start, week.end);
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma semana" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as semanas (Personalizado)</SelectItem>
                                {weeks.map((week) => (
                                    <SelectItem key={week.id} value={week.id}>
                                        {week.label} ({week.subLabel})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtro Manual (Escondido se semana selecionada) */}
                    {!selectedWeek && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                            <MarketingDateFilterComponent
                                label="Filtro de Data Início (Personalizado)"
                                filter={filters.filtroDataInicio}
                                onFilterChange={(filter) => {
                                    handleFilterChange('filtroDataInicio', filter);
                                }}
                            />
                        </div>
                    )}

                    {selectedWeek && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 animate-fade-in">
                            <span>📅 Filtro ativo: <strong>{weeks.find(w => w.id === selectedWeek)?.label}</strong> ({weeks.find(w => w.id === selectedWeek)?.subLabel})</span>
                            <button
                                onClick={() => {
                                    handleWeekSelect(null, '', '');
                                }}
                                className="ml-auto underline hover:text-blue-800 dark:hover:text-blue-200"
                            >
                                Limpar filtro
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Conteúdo Principal */}
            <EntradaSaidaView
                dataInicial={filters.filtroDataInicio.dataInicial}
                dataFinal={filters.filtroDataInicio.dataFinal}
                organizationId={user?.organization_id || undefined}
            />
        </div>
    );
});

MarketingEntradaSaidaView.displayName = 'MarketingEntradaSaidaView';

export default MarketingEntradaSaidaView;
