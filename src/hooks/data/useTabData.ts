
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UtrData, EntregadoresData, ValoresEntregador, CurrentUser } from '@/types';
import { useCache } from './useCache';
import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { FilterPayload } from '@/types/filters';
import { fetchTabData } from '@/utils/tabData/fetchTabData';

type TabData = UtrData | EntregadoresData | ValoresEntregador[] | null;

// Tabs que gerenciam seus próprios dados (Dashboard, Análise, etc.)
const SELF_MANAGED_TABS = ['evolucao', 'dashboard', 'analise', 'comparacao', 'marketing', 'resumo'];

export function useTabData(activeTab: string, filterPayload: object, currentUser?: CurrentUser | null) {
  const [data, setData] = useState<TabData>(null);
  const [loading, setLoading] = useState(false);
  const fetchIdRef = useRef(0); // Simple incrementing ID to track the latest fetch
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoading: isOrgLoading } = useOrganization();

  const { getCached, setCached } = useCache<TabData>({
    ttl: CACHE.TAB_DATA_TTL,
    getCacheKey: (params) => `${params.tab}-${JSON.stringify(params.filterPayload)}`,
  });

  const filterPayloadStr = useMemo(() => JSON.stringify(filterPayload), [filterPayload]);

  const fetchData = useCallback(async (tab: string, payload: FilterPayload, fetchId: number) => {
    // Check cache first
    const cached = getCached({ tab, filterPayload: payload });
    if (cached !== null) {
      // Only set data if this is still the latest fetch
      if (fetchIdRef.current === fetchId) {
        setData(tab === 'valores' ? (Array.isArray(cached) ? cached : []) : cached);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const result = await fetchTabData({ tab, filterPayload: payload });

      // After await: check if this is STILL the latest fetch
      if (fetchIdRef.current !== fetchId) return; // Stale — discard silently

      if (result.error) {
        // Set empty data on error
        if (tab === 'entregadores' || tab === 'prioridade') setData({ entregadores: [], total: 0 });
        else if (tab === 'valores') setData([]);
        else setData(null);
        setLoading(false);
        return;
      }

      let processedData: TabData;
      if (tab === 'valores') {
        const list = Array.isArray(result.data) ? result.data as ValoresEntregador[] : [];
        if (result.total !== undefined) (list as any).total = result.total;
        processedData = list;
      } else {
        processedData = result.data as TabData;
      }

      setData(processedData);
      setCached({ tab, filterPayload: payload }, processedData);
      setLoading(false);
    } catch (error) {
      if (fetchIdRef.current !== fetchId) return; // Stale — discard

      const msg = error instanceof Error ? error.message : '';
      if (msg === 'RETRY_500' || msg === 'RETRY_RATE_LIMIT') {
        // Retry after delay
        const delay = msg === 'RETRY_500' ? DELAYS.RETRY_500 : DELAYS.RETRY_RATE_LIMIT;
        setTimeout(() => {
          if (fetchIdRef.current === fetchId) {
            fetchData(tab, payload, fetchId);
          }
        }, delay);
        return;
      }

      // Set empty data on error
      if (tab === 'entregadores' || tab === 'prioridade') setData({ entregadores: [], total: 0 });
      else if (tab === 'valores') setData([]);
      else setData(null);
      setLoading(false);
    }
  }, [getCached, setCached]);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Wait for org context to load
    if (isOrgLoading) return;

    // Tabs that manage their own data
    if (SELF_MANAGED_TABS.includes(activeTab)) {
      fetchIdRef.current++; // Invalidate any in-flight fetch
      setData(null);
      setLoading(false);
      return;
    }

    // Increment fetch ID — this invalidates any previous in-flight fetch
    const currentFetchId = ++fetchIdRef.current;
    const payload = JSON.parse(filterPayloadStr) as FilterPayload;

    // Fetch immediately — no debounce for tab changes, simple and reliable
    fetchData(activeTab, payload, currentFetchId);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [activeTab, filterPayloadStr, isOrgLoading, fetchData]);

  return { data, loading };
}
