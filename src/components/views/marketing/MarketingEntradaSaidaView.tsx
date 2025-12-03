'use client';

import React from 'react';
import { useMarketingData } from './useMarketingData';
import { MarketingFiltersSection } from './MarketingFiltersSection';
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
            {/* Filtros de Data */}
            <MarketingFiltersSection
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            {/* Conteúdo Principal */}
            <EntradaSaidaView
                dataInicial={filters.filtroRodouDia.dataInicial}
                dataFinal={filters.filtroRodouDia.dataFinal}
                organizationId={user?.organization_id || undefined}
            />
        </div>
    );
});

MarketingEntradaSaidaView.displayName = 'MarketingEntradaSaidaView';

export default MarketingEntradaSaidaView;
