import React, { useState, useEffect } from 'react';
import { EntradaSaidaView } from './EntradaSaidaView';
import { useAuth } from '@/hooks/auth/useAuth';
import { MarketingFilters } from './MarketingFilters';

const MarketingEntradaSaidaView = React.memo(function MarketingEntradaSaidaView() {
    const { user } = useAuth();

    // Estado local para os inputs (não dispara busca)
    const [filters, setFilters] = useState({
        dataInicial: '',
        dataFinal: '',
        praca: null as string | null
    });

    // Estado aplicado (dispara busca)
    const [appliedFilters, setAppliedFilters] = useState({
        dataInicial: '',
        dataFinal: '',
        praca: null as string | null
    });

    // Definir datas padrão no mount (ano atual)
    useEffect(() => {
        const today = new Date();
        const startYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endYear = today.toISOString().split('T')[0]; // Até hoje

        const initialFilters = {
            dataInicial: startYear,
            dataFinal: endYear,
            praca: null
        };

        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
    }, []);

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
    };

    const handleClearFilters = () => {
        const today = new Date();
        const startYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endYear = today.toISOString().split('T')[0];

        const resetFilters = {
            dataInicial: startYear,
            dataFinal: endYear,
            praca: null
        };

        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
    };

    // Quick filter presets (updates inputs only)
    const handleQuickFilter = (type: 'week' | 'month' | 'quarter' | 'year') => {
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
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                break;
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
    };

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
