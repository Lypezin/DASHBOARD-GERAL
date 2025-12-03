import React from 'react';
import { useMarketingData } from './useMarketingData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/useAuth';

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const {
        loading,
        error,
        filters,
        handleFilterChange
    } = useMarketingData();

    const { user } = useAuth();
    const [selectedWeek, setSelectedWeek] = React.useState<string | null>(null);

    // Gerar últimas 12 semanas
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
            result.push(`${year}-W${weekNumber.toString().padStart(2, '0')}`);
        }
        return result;
    }, []);

    const handleWeekSelect = (weekStr: string) => {
        if (selectedWeek === weekStr) {
            setSelectedWeek(null);
            handleFilterChange('filtroDataInicio', { dataInicial: null, dataFinal: null });
            return;
        }

        setSelectedWeek(weekStr);

        // Parse week string (YYYY-Www) to dates
        const [year, week] = weekStr.split('-W').map(Number);

        // Simple calculation for ISO week start (Monday)
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dayOfWeek = simple.getDay();
        const isoWeekStart = simple;
        if (dayOfWeek <= 4)
            isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
            isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());

        const start = isoWeekStart;
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        handleFilterChange('filtroDataInicio', {
            dataInicial: start.toISOString().split('T')[0],
            dataFinal: end.toISOString().split('T')[0]
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
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Filtrar por Semana
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {weeks.map((week) => (
                                <button
                                    key={week}
                                    onClick={() => handleWeekSelect(week)}
                                    className={`
                                        px-3 py-1.5 text-sm rounded-md border transition-colors
                                        ${selectedWeek === week
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                        }
                                    `}
                                >
                                    {week}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MarketingDateFilterComponent
                            label="Filtro de Data Início"
                            filter={filters.filtroDataInicio}
                            onFilterChange={(filter) => {
                                setSelectedWeek(null); // Clear week selection if manual date is picked
                                handleFilterChange('filtroDataInicio', filter);
                            }}
                        />
                    </div>
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
