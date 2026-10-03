import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CurrentUser } from '@/types';
import { useCache } from './useCache';
import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FilterPayload } from '@/types/filters';
import { fetchTabData } from '@/utils/tabData/fetchTabData';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
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

function resolvePayloadOrganizationId(payload: FilterPayload, fallback?: string | null) {
  const payloadOrganizationId = typeof payload.p_organization_id === 'string'
    ? payload.p_organization_id.trim()
    : '';

  return payloadOrganizationId || fallback || null;
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
  currentUser?: CurrentUser | null,
  options: UseTabDataOptions = {}
) {
  const [data, setData] = useState<TabData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedRequestKey, setResolvedRequestKey] = useState<string | null>(null);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [dataTabScope, setDataTabScope] = useState<string | null>(null);
  const [dataAccessScopeKey, setDataAccessScopeKey] = useState<string | null>(null);
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

  const payloadOrganizationId = resolvePayloadOrganizationId(filterPayload as FilterPayload, currentUser?.organization_id);
  const accessScopeKey = createAccessScopeKey(currentUser, payloadOrganizationId);
  const filterPayloadStr = useMemo(() => createRequestKey({
    payload: filterPayload,
    organizationId: payloadOrganizationId,
    accessScopeKey,
  }), [accessScopeKey, filterPayload, payloadOrganizationId]);
  if (!stableFilterPayloadRef.current || stableFilterPayloadRef.current.key !== filterPayloadStr) {
    stableFilterPayloadRef.current = { key: filterPayloadStr, payload: filterPayload as FilterPayload };
  }
  const stableFilterPayload = stableFilterPayloadRef.current.payload;
  const currentOrganizationId = resolvePayloadOrganizationId(stableFilterPayload, currentUser?.organization_id);
  const currentTabScope = getTabScope(activeTab);
  const currentRequestKey = getTabCacheKey(currentTabScope, filterPayloadStr);
  const isManagedTab = !SELF_MANAGED_TABS.includes(activeTab);
  hasCurrentDataRef.current = hasLoadedData(data)
    && dataOrganizationId === currentOrganizationId
    && dataAccessScopeKey === accessScopeKey
    && dataTabScope === currentTabScope;

  // Keep same-organization data visible while filters refresh, but hide a prior
  // organization's rows immediately when the organization scope changes.
  const visibleData = isManagedTab && (
    dataOrganizationId !== currentOrganizationId
    || dataAccessScopeKey !== accessScopeKey
    || dataTabScope !== currentTabScope
  )
    ? null
    : data;

  const resetTabState = useCallback(() => {
    fetchIdRef.current++;
    retryAttemptsRef.current.clear();
    setData((previousData) => (previousData === null ? previousData : null));
    setDataOrganizationId(null);
    setDataTabScope(null);
    setDataAccessScopeKey(null);
    setResolvedRequestKey(null);
    setLoading((previousLoading) => (previousLoading ? false : previousLoading));
    setError(null);
  }, []);

  const fetchData = useCallback(async (tab: string, payload: FilterPayload, filterPayloadKey: string, fetchId: number) => {
    const tabScope = getTabScope(tab);
    const requestTab = getRequestTab(tab);
    const requestKey = getTabCacheKey(tabScope, filterPayloadKey);
    const cacheParams = { tab: tabScope, filterPayloadKey };
    const cached = getCached(cacheParams);

    if (cached !== null) {
      if (fetchIdRef.current === fetchId) {
        setData(tab === 'valores' ? (Array.isArray(cached) ? cached : []) : cached);
        setDataOrganizationId(resolvePayloadOrganizationId(payload, currentUser?.organization_id));
        setDataTabScope(tabScope);
        setDataAccessScopeKey(accessScopeKey);
        setResolvedRequestKey(requestKey);
        setLoading(false);
        setError(null);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestKey = `${tabScope}-${filterPayloadKey}`;
      let request = SHARED_TAB_REQUESTS.get(requestKey);

      if (!request) {
        request = (async () => {
          const result = await fetchTabData({ tab: requestTab, filterPayload: payload, requestScopeKey: accessScopeKey });
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
      setDataOrganizationId(resolvePayloadOrganizationId(payload, currentUser?.organization_id));
      setDataTabScope(tabScope);
      setDataAccessScopeKey(accessScopeKey);
      setResolvedRequestKey(requestKey);
      setCached(cacheParams, processedData);
      setLoading(false);
      setError(null);
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return;

      const msg = error instanceof Error ? error.message : '';
      if (msg === 'RETRY_500' || msg === 'RETRY_RATE_LIMIT') {
        const currentAttempts = retryAttemptsRef.current.get(fetchId) || 0;

        if (currentAttempts >= 1) {
          retryAttemptsRef.current.delete(fetchId);
          if (!hasCurrentDataRef.current) {
            setDataOrganizationId(resolvePayloadOrganizationId(payload, currentUser?.organization_id));
            setDataTabScope(tabScope);
            setDataAccessScopeKey(accessScopeKey);
          }
          setResolvedRequestKey(requestKey);
          setData((previousData) => {
            if (hasCurrentDataRef.current && hasLoadedData(previousData)) return previousData;
            return getTabFallbackData(tab);
          });
          setLoading(false);
          setError('Nao foi possivel carregar os dados depois de uma nova tentativa.');
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
      if (!hasCurrentDataRef.current) {
        setDataOrganizationId(resolvePayloadOrganizationId(payload, currentUser?.organization_id));
        setDataTabScope(tabScope);
        setDataAccessScopeKey(accessScopeKey);
      }
      setResolvedRequestKey(requestKey);
      setData((previousData) => {
        if (hasCurrentDataRef.current && hasLoadedData(previousData)) return previousData;
        return getTabFallbackData(tab);
      });
      setLoading(false);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados.');
    }
  }, [accessScopeKey, currentUser?.organization_id, getCached, setCached]);

  const retry = useCallback(() => {
    const currentPayload = stableFilterPayloadRef.current;
    if (!currentPayload) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const fetchId = ++fetchIdRef.current;
    retryAttemptsRef.current.delete(fetchId);
    void fetchData(activeTab, currentPayload.payload, currentPayload.key, fetchId);
  }, [activeTab, fetchData]);

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
      resetTabState();
      return;
    }

    if (isOrgLoading) return;

    const payload = stableFilterPayload;
    const hasOrganizationContext = currentOrganizationId !== null;

    if (SELF_MANAGED_TABS.includes(activeTab)) {
      resetTabState();
      return;
    }

    if (!hasOrganizationContext) {
      resetTabState();
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    const tabScope = getTabScope(activeTab);
    const cached = getCached({ tab: tabScope, filterPayloadKey: filterPayloadStr });

    if (cached !== null) {
      setData(activeTab === 'valores' ? (Array.isArray(cached) ? cached : []) : cached);
      setDataOrganizationId(currentOrganizationId);
      setDataTabScope(tabScope);
      setDataAccessScopeKey(accessScopeKey);
      setResolvedRequestKey(currentRequestKey);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const networkDelay = hasCurrentDataRef.current ? DELAYS.DEBOUNCE : 0;
    debounceRef.current = setTimeout(() => {
      void fetchData(activeTab, payload, filterPayloadStr, currentFetchId);
    }, networkDelay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [accessScopeKey, activeTab, currentOrganizationId, currentRequestKey, enabled, fetchData, filterPayloadStr, getCached, isOrgLoading, resetTabState, stableFilterPayload]);

  const waitingForCurrentRequest = enabled && isManagedTab && (
    isOrgLoading || (
      currentOrganizationId !== null && resolvedRequestKey !== currentRequestKey
    )
  );
  const isCurrentDataScope = dataOrganizationId === currentOrganizationId
    && dataAccessScopeKey === accessScopeKey;

  return {
    data: isManagedTab && (!isCurrentDataScope || dataTabScope !== currentTabScope) ? null : visibleData,
    loading: enabled && isManagedTab && (loading || waitingForCurrentRequest),
    error: resolvedRequestKey === currentRequestKey ? error : null,
    retry,
  };
}
