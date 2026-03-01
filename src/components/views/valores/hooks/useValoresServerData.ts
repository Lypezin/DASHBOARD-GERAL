import { useState, useEffect, useCallback } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { ValoresEntregador } from '@/types';
import { fetchValoresDetalhados } from '@/utils/tabData/fetchers/valoresFetcher';
import { FilterPayload } from '@/types/filters';

export function useValoresServerData(initialData: ValoresEntregador[] | null, filters: any) {
    const [allData, setAllData] = useState<ValoresEntregador[]>(initialData || []);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalServerItems, setTotalServerItems] = useState(0);

    useEffect(() => {
        if (initialData) {
            setAllData(initialData);
            const total = (initialData as any).total;
            if (total !== undefined) {
                setTotalServerItems(total);
                setHasMore(initialData.length < total);
            } else {
                setHasMore(false);
            }
        }
    }, [initialData]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextOffset = allData.length;

        try {
            const payload: FilterPayload = {
                ...filters,
                p_limit: 25,
                p_offset: nextOffset,
                detailed: true
            };

            const result = await fetchValoresDetalhados({ filterPayload: payload });

            if (result.data) {
                setAllData(prev => [...prev, ...result.data!]);
                if (result.total) setTotalServerItems(result.total);

                if (result.data.length < 25) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }

        } catch (e) {
            safeLog.error('Error loading more items', e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [allData.length, filters, hasMore, isLoadingMore]);

    return { allData, setAllData, hasMore, isLoadingMore, totalServerItems, loadMore };
}
