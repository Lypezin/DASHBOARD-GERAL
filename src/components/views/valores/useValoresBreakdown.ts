
import { useState, useEffect } from 'react';
import { ValoresBreakdown } from '@/types/financeiro';
import { fetchValoresBreakdown } from '@/utils/tabData/fetchers/valoresFetcher';
import { FilterPayload } from '@/types/filters';

export function useValoresBreakdown(filterPayload: FilterPayload, enabled: boolean) {
    const [data, setData] = useState<ValoresBreakdown | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setData(null);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchValoresBreakdown({ filterPayload });
                if (isMounted) {
                    if (result.error) {
                        setError(result.error.message || 'Erro ao carregar breakdown');
                    } else {
                        setData(result.data);
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Erro desconhecido');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [filterPayload, enabled]);

    return { data, loading, error };
}
