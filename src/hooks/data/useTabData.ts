import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CurrentUser } from '@/types';
import { useCache } from './useCache';
import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FilterPayload } from '@/types/filters';
import { fetchTabData } from '@/utils/tabData/fetchTabData';
import { processTabSuccessData, getTabFallbackData, TabData } from './tabDataHelpers';

const SELF_MANAGED_TABS = ['evolucao', 'dashboard', 'analise', 'comparacao', 'marketing', 'resumo'];
const SHARED_TAB_SCOPES: Record<string, string> = {
  entregadores: 'entregadores_shared',
  prioridade: 'entregadores_shared',
};
const SHARED_TAB_REQUESTS = new Map<string, Promise<TabData>>();

function getTabScope(tab: string) {
  return SHARED_TAB_SCOPES[tab] || tab;
}

function getRequestTab(tab: string) {
  return tab === 'prioridade' ? 'entregadores' : tab;
}

export function useTabData(activeTab: string, filterPayload: object, _currentUser?: CurrentUser | null) {
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
    const tabScope = getTabScope(tab);
    const requestTab = getRequestTab(tab);
    const cacheParams = { tab: tabScope, filterPayloadKey };
    const cached = getCached(cacheParams);

    if (cached !== null) {
      if (fetchIdRef.current === fetchId) {
        setData(tab === 'valores' ? (Array.isArray(cached) ? cached : []) : cached);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const requestKey = `${tabScope}-${filterPayloadKey}`;
      let request = SHARED_TAB_REQUESTS.get(requestKey);

      if (!request) {
        request = (async () => {
          const result = await fetchTabData({ tab: requestTab, filterPayload: payload });
          if (result.error) {
            throw result.error;
          }

          return processTabSuccessData(requestTab, result);
        })().finally(() => {
          SHARED_TAB_REQUESTS.delete(requestKey);
        });

        SHARED_TAB_REQUESTS.set(requestKey, request);
      }

      const processedData = await request;
      if (fetchIdRef.current !== fetchId) return;

      setData(processedData);
      setCached(cacheParams, processedData);
      setLoading(false);
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;

      const msg = error instanceof Error ? error.message : '';
      if (msg === 'RETRY_500' || msg === 'RETRY_RATE_LIMIT') {
        setTimeout(() => {
          if (fetchIdRef.current === fetchId) {
            void fetchData(tab, payload, filterPayloadKey, fetchId);
          }
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
    void fetchData(activeTab, filterPayload as FilterPayload, filterPayloadStr, currentFetchId);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeTab, fetchData, filterPayload, filterPayloadStr, isOrgLoading]);

  return { data, loading };
}
