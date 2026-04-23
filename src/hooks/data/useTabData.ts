import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UtrData, EntregadoresData, ValoresEntregador, CurrentUser } from '@/types';
import { useCache } from './useCache';
import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FilterPayload } from '@/types/filters';
import { fetchTabData } from '@/utils/tabData/fetchTabData';
import { processTabSuccessData, getTabFallbackData, TabData } from './tabDataHelpers';

const SELF_MANAGED_TABS = ['evolucao', 'dashboard', 'analise', 'comparacao', 'marketing', 'resumo'];

export function useTabData(activeTab: string, filterPayload: object, currentUser?: CurrentUser | null) {
  const [data, setData] = useState<TabData>(null);
  const [loading, setLoading] = useState(false);
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoading: isOrgLoading } = useOrganization();

  const { getCached, setCached } = useCache<TabData>({
    ttl: CACHE.TAB_DATA_TTL,
    getCacheKey: (params) => `${params.tab}-${params.filterPayloadKey}`,
  });

  const filterPayloadStr = useMemo(() => JSON.stringify(filterPayload), [filterPayload]);

  const fetchData = useCallback(async (tab: string, payload: FilterPayload, filterPayloadKey: string, fetchId: number) => {
    const cached = getCached({ tab, filterPayloadKey });
    if (cached !== null) {
      if (fetchIdRef.current === fetchId) {
        setData(tab === 'valores' ? (Array.isArray(cached) ? cached : []) : cached);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const result = await fetchTabData({ tab, filterPayload: payload });
      if (fetchIdRef.current !== fetchId) return;

      if (result.error) {
        setData(getTabFallbackData(tab));
        setLoading(false);
        return;
      }

      const processedData = processTabSuccessData(tab, result);
      setData(processedData);
      setCached({ tab, filterPayloadKey }, processedData);
      setLoading(false);
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;

      const msg = error instanceof Error ? error.message : '';
      if (msg === 'RETRY_500' || msg === 'RETRY_RATE_LIMIT') {
        setTimeout(() => {
          if (fetchIdRef.current === fetchId) fetchData(tab, payload, filterPayloadKey, fetchId);
        }, msg === 'RETRY_500' ? DELAYS.RETRY_500 : DELAYS.RETRY_RATE_LIMIT);
        return;
      }

      setData(getTabFallbackData(tab));
      setLoading(false);
    }
  }, [getCached, setCached]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (isOrgLoading) return;

    if (SELF_MANAGED_TABS.includes(activeTab)) {
      fetchIdRef.current++;
      setData(null);
      setLoading(false);
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    fetchData(activeTab, filterPayload as FilterPayload, filterPayloadStr, currentFetchId);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeTab, fetchData, filterPayload, filterPayloadStr, isOrgLoading]);

  return { data, loading };
}
