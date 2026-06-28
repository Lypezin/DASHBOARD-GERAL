'use client';

import React from 'react';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/auth/useAuth';
import { MarketingFilters } from './MarketingFilters';
import { useMarketingFilters } from './hooks/useMarketingFilters';

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const { user } = useAuth();
    const {
        filters,
        setFilters,
        appliedFilters,
        handleApplyFilters,
        handleClearFilters,
        handleQuickFilter
    } = useMarketingFilters();

    return (
        <div className="space-y-6 motion-safe:animate-fade-in pb-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-sky-500 to-blue-600 shadow-sm" />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            Fluxo de Entrada e Saída
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Análise de adesão e desligamento de entregadores
                        </p>
                    </div>
                </div>
                <MarketingFilters
                    filters={filters}
                    appliedFilters={appliedFilters}
                    setFilters={setFilters}
                    handleApplyFilters={handleApplyFilters}
                    handleClearFilters={handleClearFilters}
                    handleQuickFilter={handleQuickFilter}
                />
            </div>

            {appliedFilters.dataInicial && appliedFilters.dataFinal && (
                <EntradaSaidaView
                    dataInicial={appliedFilters.dataInicial}
                    dataFinal={appliedFilters.dataFinal}
                    organizationId={user?.organization_id || undefined}
                    praca={appliedFilters.praca}
                />
            )}
        </div>
    );
});

MarketingEntradaSaidaView.displayName = 'MarketingEntradaSaidaView';

export default MarketingEntradaSaidaView;
