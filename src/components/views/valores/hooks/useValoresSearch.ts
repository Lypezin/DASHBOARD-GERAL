import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ValoresEntregador } from '@/types';
import { useUrlSearchSync } from '@/hooks/ui/useUrlSearchSync';

export function useValoresSearch(valoresData: ValoresEntregador[] | null) {
    const searchParams = useSearchParams();
    const getInitialSearchTerm = () => searchParams.get('val_search') || '';

    const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);

    useUrlSearchSync('val_search', searchTerm);

    const dataToDisplay = useMemo(() => {
        const valoresArray = Array.isArray(valoresData) ? valoresData : [];
        const term = searchTerm.trim().toLowerCase();

        if (!term) {
            return valoresArray;
        }

        return valoresArray.filter(e =>
            e?.nome_entregador?.toLowerCase().includes(term) ||
            e?.id_entregador?.toLowerCase().includes(term)
        );
    }, [searchTerm, valoresData]);

    return {
        searchTerm,
        setSearchTerm,
        isSearching: false,
        error: null,
        dataToDisplay
    };
}
