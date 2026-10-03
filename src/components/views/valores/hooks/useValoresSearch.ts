import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUrlSearchSync } from '@/hooks/ui/useUrlSearchSync';

export function useValoresSearch() {
    const searchParams = useSearchParams();
    const getInitialSearchTerm = () => searchParams.get('val_search') || '';

    const [searchTerm, setSearchTermState] = useState(getInitialSearchTerm);
    const [isPending, startTransition] = useTransition();
    const normalizedSearchTerm = searchTerm.trim();
    const shouldSyncSearch = normalizedSearchTerm.length >= 3 || normalizedSearchTerm.length === 0;

    useUrlSearchSync('val_search', searchTerm, 250, shouldSyncSearch);

    const setSearchTerm = (value: string) => {
        startTransition(() => {
            setSearchTermState(value);
        });
    };

    return {
        searchTerm,
        setSearchTerm,
        isSearching: isPending,
    };
}
