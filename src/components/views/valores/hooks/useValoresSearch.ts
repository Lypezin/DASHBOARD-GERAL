import { useDeferredValue, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { ValoresEntregador } from '@/types';
import { useUrlSearchSync } from '@/hooks/ui/useUrlSearchSync';

export function useValoresSearch(valoresData: ValoresEntregador[] | null) {
    const searchParams = useSearchParams();
    const getInitialSearchTerm = () => searchParams.get('val_search') || '';

    const [searchTerm, setSearchTermState] = useState(getInitialSearchTerm);
    const [isPending, startTransition] = useTransition();
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const normalizedSearchTerm = searchTerm.trim();
    const normalizedDeferredSearchTerm = deferredSearchTerm.trim().toLowerCase();
    const shouldSyncSearch = normalizedSearchTerm.length >= 3 || normalizedSearchTerm.length === 0;

    useUrlSearchSync('val_search', searchTerm, 250, shouldSyncSearch);

    const setSearchTerm = (value: string) => {
        startTransition(() => {
            setSearchTermState(value);
        });
    };

    const indexedValores = useMemo(() => {
        const valoresArray = Array.isArray(valoresData) ? valoresData : [];
        return valoresArray.map((item) => ({
            item,
            searchText: `${item?.nome_entregador || ''} ${item?.id_entregador || ''}`.toLowerCase(),
        }));
    }, [valoresData]);

    const dataToDisplay = useMemo(() => {
        if (!normalizedDeferredSearchTerm) {
            return indexedValores.map(({ item }) => item);
        }

        return indexedValores
            .filter(({ searchText }) => searchText.includes(normalizedDeferredSearchTerm))
            .map(({ item }) => item);
    }, [indexedValores, normalizedDeferredSearchTerm]);

    return {
        searchTerm,
        setSearchTerm,
        isSearching: isPending || deferredSearchTerm !== searchTerm,
        error: null,
        dataToDisplay
    };
}
