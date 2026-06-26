import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CurrentUser } from '@/types';
import { useCache } from './useCache';
import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FilterPayload } from '@/types/filters';
import { fetchTabData } from '@/utils/tabData/fetchTabData';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { processTabSuccessData, getTabFallbackData, TabData } from './tabDataHelpers';

const SELF_MANAGED_TABS = ['evolucao', 'dashboard', 'analise', 'comparacao', 'marketing'];
const SHARED_TAB_SCOPES: Record<string, string> = {
  entregadores: 'entregadores_shared',
  prioridade: 'entregadores_shared',
  dedicado: 'dedicado_shared',
};
const SHARED_TAB_REQUESTS = new Map<string, Promise<TabData>>();

function getTabScope(tab: string) {
  return SHARED_TAB_SCOPES[tab] || tab;
}

function getRequestTab(tab: string) {
  if (tab === 'dedicado') return 'dedicado';
  return tab === 'prioridade' ? 'entregadores' : tab;
}

function getTabCacheKey(tab: string, filterPayloadKey: string) {
  return `${tab}-${filterPayloadKey}`;
}

interface UseTabDataOptions {
  enabled?: boolean;
}

function hasLoadedData(data: TabData) {
  if (data === null || data === undefined) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object' && 'entregadores' in data) {
    const entregadores = (data as { entregadores?: unknown }).entregadores;
    return Array.isArray(entregadores) ? entregadores.length > 0 : true;
  }
  return true;
}

export function useTabData(
  activeTab: string,
  filterPayload: object,
  _currentUser?: CurrentUser | null,
  options: UseTabDataOptions = {}
) {
  const [data, setData] = useState<TabData>(null);
  const [loading, setLoading] = useState(false);
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptsRef = useRef<Map<number, number>>(new Map());
  const hasCurrentDataRef = useRef(false);
  const stableFilterPayloadRef = useRef<{ key: string; payload: FilterPayload } | null>(null);
  const { isLoading: isOrgLoading } = useOrganization();
  const enabled = options.enabled ?? true;

  const { getCached, setCached } = useCache<TabData>({
    ttl: CACHE.TAB_DATA_TTL,
    getCacheKey: (params) => getTabCacheKey(params.tab, params.filterPayloadKey),
  });

  const filterPayloadStr = useMemo(() => createRequestKey(filterPayload), [filterPayload]);
  if (!stableFilterPayloadRef.current || stableFilterPayloadRef.current.key !== filterPayloadStr) {
    stableFilterPayloadRef.current = { key: filterPayloadStr, payload: filterPayload as FilterPayload };
  }
  const stableFilterPayload = stableFilterPayloadRef.current.payload;
  hasCurrentDataRef.current = hasLoadedData(data);

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

      retryAttemptsRef.current.delete(fetchId);
      setData(processedData);
      setCached(cacheParams, processedData);
      setLoading(false);
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;

      const msg = error instanceof Error ? error.message : '';
      if (msg === 'RETRY_500' || msg === 'RETRY_RATE_LIMIT') {
        const currentAttempts = retryAttemptsRef.current.get(fetchId) || 0;

        if (currentAttempts >= 1) {
          retryAttemptsRef.current.delete(fetchId);
          setData((previousData) => {
            if (hasLoadedData(previousData)) return previousData;
            return getTabFallbackData(tab);
          });
          setLoading(false);
          return;
        }

        retryAttemptsRef.current.set(fetchId, currentAttempts + 1);

        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          if (fetchIdRef.current === fetchId) {
            void fetchData(tab, payload, filterPayloadKey, fetchId);
          }
        }, msg === 'RETRY_500' ? DELAYS.RETRY_500 : DELAYS.RETRY_RATE_LIMIT);
        return;
      }

      retryAttemptsRef.current.delete(fetchId);
      setData((previousData) => {
        if (hasLoadedData(previousData)) return previousData;
        return getTabFallbackData(tab);
      });
      setLoading(false);
    }
  }, [getCached, setCached]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (!enabled) {
      fetchIdRef.current++;
      setData(null);
      setLoading(false);
      return;
    }

    if (isOrgLoading) return;

    const payload = stableFilterPayload;
    const hasOrganizationContext = typeof payload.p_organization_id === 'string' && payload.p_organization_id.trim().length > 0;

    if (SELF_MANAGED_TABS.includes(activeTab)) {
      fetchIdRef.current++;
      setData(null);
      setLoading(false);
      return;
    }

    if (!hasOrganizationContext) {
      fetchIdRef.current++;
      setData(null);
      setLoading(false);
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    const tabScope = getTabScope(activeTab);
    const cached = getCached({ tab: tabScope, filterPayloadKey: filterPayloadStr });

    if (cached !== null) {
      setData(activeTab === 'valores' ? (Array.isArray(cached) ? cached : []) : cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const networkDelay = hasCurrentDataRef.current ? DELAYS.DEBOUNCE : 0;
    debounceRef.current = setTimeout(() => {
      void fetchData(activeTab, payload, filterPayloadStr, currentFetchId);
    }, networkDelay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [activeTab, enabled, fetchData, filterPayloadStr, getCached, isOrgLoading, stableFilterPayload]);

  return { data, loading };
}
