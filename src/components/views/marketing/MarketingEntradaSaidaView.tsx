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
        <div className="space-y-6 animate-fade-in pb-8">
            <MarketingFilters
                filters={filters}
                appliedFilters={appliedFilters}
                setFilters={setFilters}
                handleApplyFilters={handleApplyFilters}
                handleClearFilters={handleClearFilters}
                handleQuickFilter={handleQuickFilter}
            />

            {/* Conteúdo Principal */}
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
