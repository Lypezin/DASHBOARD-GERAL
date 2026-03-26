import { useState } from 'react';
import { ValoresCidadeDateFilter, MarketingDateFilter } from '@/types';

export function useValoresCidadeFilters() {
    const [filter, setFilter] = useState<ValoresCidadeDateFilter>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('valores_cidade_filter');
            if (saved) return JSON.parse(saved);
        }
        return { dataInicial: null, dataFinal: null };
    });

    const [filterEnviados, setFilterEnviados] = useState<MarketingDateFilter>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('valores_cidade_filter_enviados');
            if (saved) return JSON.parse(saved);
        }
        return { dataInicial: null, dataFinal: null };
    });

    const handleFilterChange = (newFilter: ValoresCidadeDateFilter) => {
        setFilter(newFilter);
        sessionStorage.setItem('valores_cidade_filter', JSON.stringify(newFilter));
    };

    const handleFilterEnviadosChange = (newFilter: MarketingDateFilter) => {
        setFilterEnviados(newFilter);
        sessionStorage.setItem('valores_cidade_filter_enviados', JSON.stringify(newFilter));
    };

    return { 
        filter, 
        filterEnviados, 
        handleFilterChange, 
        handleFilterEnviadosChange 
    };
}
