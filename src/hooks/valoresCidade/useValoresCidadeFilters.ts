import { useState } from 'react';
import { ValoresCidadeDateFilter, MarketingDateFilter } from '@/types';
import { readJsonStorage, writeJsonStorage } from '@/utils/storage/jsonStorage';

const VALORES_CIDADE_FILTER_KEY = 'valores_cidade_filter';
const VALORES_CIDADE_ENVIADOS_FILTER_KEY = 'valores_cidade_filter_enviados';
const EMPTY_DATE_FILTER = { dataInicial: null, dataFinal: null };

export function useValoresCidadeFilters() {
    const [filter, setFilter] = useState<ValoresCidadeDateFilter>(() => {
        return readJsonStorage<ValoresCidadeDateFilter>(
            typeof window !== 'undefined' ? sessionStorage : undefined,
            VALORES_CIDADE_FILTER_KEY,
            EMPTY_DATE_FILTER
        );
    });

    const [filterEnviados, setFilterEnviados] = useState<MarketingDateFilter>(() => {
        return readJsonStorage<MarketingDateFilter>(
            typeof window !== 'undefined' ? sessionStorage : undefined,
            VALORES_CIDADE_ENVIADOS_FILTER_KEY,
            EMPTY_DATE_FILTER
        );
    });

    const handleFilterChange = (newFilter: ValoresCidadeDateFilter) => {
        setFilter(newFilter);
        writeJsonStorage(typeof window !== 'undefined' ? sessionStorage : undefined, VALORES_CIDADE_FILTER_KEY, newFilter);
    };

    const handleFilterEnviadosChange = (newFilter: MarketingDateFilter) => {
        setFilterEnviados(newFilter);
        writeJsonStorage(typeof window !== 'undefined' ? sessionStorage : undefined, VALORES_CIDADE_ENVIADOS_FILTER_KEY, newFilter);
    };

    return { 
        filter, 
        filterEnviados, 
        handleFilterChange, 
        handleFilterEnviadosChange 
    };
}
