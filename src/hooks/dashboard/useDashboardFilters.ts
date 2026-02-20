import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Filters } from '@/types';
import { useGamification } from '@/contexts/GamificationContext';
import { getInitialFiltersFromUrl, buildFilterQueryParams, handleProtectedUpdate } from './dashboardFilterHelpers';

export function useDashboardFilters() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { registerInteraction } = useGamification();

    const [filters, setFilters] = useState<Filters>(() => getInitialFiltersFromUrl(searchParams));

    const filtersProtectedRef = useRef(false);
    const filtersInitializedRef = useRef(false);

    useEffect(() => {
        if (!filtersInitializedRef.current) {
            filtersInitializedRef.current = true;
            return;
        }

        const queryString = buildFilterQueryParams(filters, searchParams);
        const url = queryString ? `${pathname}?${queryString}` : pathname;
        window.history.replaceState(null, '', url);
        registerInteraction('filter_change');

    }, [filters, pathname, searchParams, registerInteraction]);

    const setFiltersProtected = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => {
        setFilters((prev) => {
            const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
            if (filtersProtectedRef.current) {
                return handleProtectedUpdate(prev, updated);
            }
            return updated;
        });
    }, []);

    return {
        filters,
        setFilters: setFiltersProtected,
        filtersProtectedRef,
        filtersInitializedRef
    };
}
