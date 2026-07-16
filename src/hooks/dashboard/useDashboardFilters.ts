import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Filters } from '@/types';
import { useOptionalGamification } from '@/contexts/GamificationContext';
import { getInitialFiltersFromUrl, buildFilterQueryParams, handleProtectedUpdate } from './dashboardFilterHelpers';

export function useDashboardFilters() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const gamification = useOptionalGamification();
    const registerInteraction = gamification?.registerInteraction;

    const [filters, setFilters] = useState<Filters>(() => getInitialFiltersFromUrl(searchParams));

    const filtersProtectedRef = useRef(false);
    const filtersInitializedRef = useRef(false);
    const lastQueryRef = useRef('');
    const urlSyncTimeoutRef = useRef<number | null>(null);

    const syncFiltersFromUrl = useCallback(() => {
        const currentParams = new URLSearchParams(window.location.search);
        const nextFilters = getInitialFiltersFromUrl(currentParams);

        setFilters((currentFilters) => {
            const currentQuery = buildFilterQueryParams(currentFilters, currentParams);
            const nextQuery = buildFilterQueryParams(nextFilters, currentParams);
            return currentQuery === nextQuery ? currentFilters : nextFilters;
        });
    }, []);

    useEffect(() => {
        if (!filtersInitializedRef.current) {
            filtersInitializedRef.current = true;
            lastQueryRef.current = buildFilterQueryParams(filters, searchParams);
            return;
        }

        const currentParams = new URLSearchParams(window.location.search);
        const queryString = buildFilterQueryParams(filters, currentParams);
        if (queryString === lastQueryRef.current) {
            return;
        }

        if (urlSyncTimeoutRef.current !== null) {
            window.clearTimeout(urlSyncTimeoutRef.current);
        }

        urlSyncTimeoutRef.current = window.setTimeout(() => {
            urlSyncTimeoutRef.current = null;
            if (queryString === lastQueryRef.current) return;

            lastQueryRef.current = queryString;
            const url = queryString ? `${pathname}?${queryString}` : pathname;
            window.history.replaceState(null, '', url);
            void registerInteraction?.('filter_change');
        }, 80);

    }, [filters, pathname, searchParams, registerInteraction]);

    useEffect(() => {
        syncFiltersFromUrl();
    }, [searchParams, syncFiltersFromUrl]);

    useEffect(() => {
        window.addEventListener('popstate', syncFiltersFromUrl);
        return () => window.removeEventListener('popstate', syncFiltersFromUrl);
    }, [syncFiltersFromUrl]);

    useEffect(() => {
        return () => {
            if (urlSyncTimeoutRef.current !== null) {
                window.clearTimeout(urlSyncTimeoutRef.current);
            }
        };
    }, []);

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
