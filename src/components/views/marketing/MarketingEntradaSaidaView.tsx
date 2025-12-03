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
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MarketingDateFilterComponent
                            label="Filtro de Data Início"
                            filter={filters.filtroDataInicio}
                            onFilterChange={(filter) => handleFilterChange('filtroDataInicio', filter)}
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
