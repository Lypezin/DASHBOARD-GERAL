import React, { useState, useEffect, useCallback } from 'react';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/auth/useAuth';
import { MarketingFilters } from './MarketingFilters';

const STORAGE_KEY = 'mkt_entrada_saida_filters';

interface FilterState {
    dataInicial: string;
    dataFinal: string;
    praca: string | null;
}

function getDefaultFilters(): FilterState {
    const today = new Date();
    return {
        dataInicial: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
        dataFinal: today.toISOString().split('T')[0],
        praca: null
    };
}

function loadPersistedFilters(): FilterState | null {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as FilterState;
            // Validate that dates exist
            if (parsed.dataInicial && parsed.dataFinal) {
                return parsed;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

function persistFilters(filters: FilterState) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
        // ignore
    }
}

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const { user } = useAuth();

    // Load persisted filters or use defaults
    const [filters, setFilters] = useState<FilterState>(() => {
        return loadPersistedFilters() || getDefaultFilters();
    });

    const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => {
        return loadPersistedFilters() || getDefaultFilters();
    });

    // Persist whenever applied filters change
    useEffect(() => {
        if (appliedFilters.dataInicial && appliedFilters.dataFinal) {
            persistFilters(appliedFilters);
        }
    }, [appliedFilters]);

    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(filters);
    }, [filters]);

    const handleClearFilters = useCallback(() => {
        const resetFilters = getDefaultFilters();
        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
    }, []);

    // Quick filter presets (updates inputs only)
    const handleQuickFilter = useCallback((type: 'week' | 'month' | 'quarter' | 'year') => {
        const today = new Date();
        let start: Date;

        switch (type) {
            case 'week':
                start = new Date(today);
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                break;
            }
            case 'year':
            default:
                start = new Date(today.getFullYear(), 0, 1);
                break;
        }

        setFilters(prev => ({
            ...prev,
            dataInicial: start.toISOString().split('T')[0],
            dataFinal: today.toISOString().split('T')[0]
        }));
    }, []);

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
