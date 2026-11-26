import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { safeLog } from '@/lib/errorHandler';
import type { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { getTimedCacheValue, setTimedCacheValue, type TimedCacheEntry } from '@/utils/cache/timedLruCache';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { ENTREGADORES_REFRESH_COMPLETE_EVENT, registerClientRefreshCleanup } from '@/utils/dashboard/dashboardDataRefreshEvents';
import { fetchDashboardEvolucaoData } from './utils/fetchEvolucao';
import { useTopLoaderSync } from '@/components/ui/TopLoader';

interface UseDashboardEvolucaoOptions {
  filterPayload: FilterPayload;
  anoEvolucao: number;
}

interface EvolucaoRequestData {
  mensalData: EvolucaoMensal[];
  semanalData: EvolucaoSemanal[];
  utrData: UtrSemanal[];
}

const evolucaoCache = new Map<string, TimedCacheEntry<EvolucaoRequestData>>();
const evolucaoInFlight = new Map<string, Promise<EvolucaoRequestData>>();
const evolucaoCachePolicy = { ttlMs: CACHE.EVOLUCAO_TTL, maxEntries: 12 } as const;

registerClientRefreshCleanup(() => {
  evolucaoCache.clear();
});

export function useDashboardEvolucao({ filterPayload, anoEvolucao }: UseDashboardEvolucaoOptions) {
  const { organizationId, isLoading: isOrgLoading } = useOrganization();
  const { currentUser } = useAppBootstrap();
  const filterPayloadKey = useMemo(() => createRequestKey(filterPayload), [filterPayload]);
  const stableFilterPayloadRef = useRef<{ key: string; payload: FilterPayload }>({ key: filterPayloadKey, payload: filterPayload });
  const stableFilterPayload = useMemo(() => {
    if (stableFilterPayloadRef.current.key !== filterPayloadKey) {
      stableFilterPayloadRef.current = { key: filterPayloadKey, payload: filterPayload };
    }
    return stableFilterPayloadRef.current.payload;
  }, [filterPayload, filterPayloadKey]);
  const currentOrganizationId = typeof stableFilterPayload.p_organization_id === 'string'
    ? stableFilterPayload.p_organization_id.trim() || organizationId || null
    : organizationId || null;
  const accessScopeKey = createAccessScopeKey(currentUser, currentOrganizationId);
  const currentSignature = useMemo(() => createRequestKey({
    filterPayload: stableFilterPayload,
    organizationId: currentOrganizationId,
    accessScopeKey,
    anoEvolucao,
  }), [accessScopeKey, anoEvolucao, currentOrganizationId, stableFilterPayload]);

  const initialCachedRef = useRef<EvolucaoRequestData | null | undefined>();
  if (initialCachedRef.current === undefined) {
    initialCachedRef.current = anoEvolucao
      ? getTimedCacheValue(evolucaoCache, currentSignature, evolucaoCachePolicy)
      : null;
  }
  const initialCached = initialCachedRef.current;

  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>(() => initialCached?.mensalData ?? []);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>(() => initialCached?.semanalData ?? []);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>(() => initialCached?.utrData ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [resolvedSignature, setResolvedSignature] = useState<string | null>(() => (initialCached ? currentSignature : null));
  const [dataSignature, setDataSignature] = useState<string | null>(() => (initialCached ? currentSignature : null));
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(() => (initialCached ? currentOrganizationId : null));
  const [dataAccessScopeKey, setDataAccessScopeKey] = useState<string | null>(() => (initialCached ? accessScopeKey : null));
  const hasVisibleDataRef = useRef(false);
  hasVisibleDataRef.current = dataSignature === currentSignature
    && dataOrganizationId === currentOrganizationId
    && dataAccessScopeKey === accessScopeKey
    && (evolucaoMensal.length > 0 || evolucaoSemanal.length > 0 || utrSemanal.length > 0);

  useEffect(() => {
    if (isOrgLoading) return;

    if (!anoEvolucao) {
      setLoading(false);
      return;
    }

    const cachedData = getTimedCacheValue(evolucaoCache, currentSignature, evolucaoCachePolicy);

    if (cachedData) {
      setEvolucaoMensal(cachedData.mensalData);
      setEvolucaoSemanal(cachedData.semanalData);
      setUtrSemanal(cachedData.utrData);
      setError(null);
      setLoading(false);
      setResolvedSignature(currentSignature);
      setDataSignature(currentSignature);
      setDataOrganizationId(currentOrganizationId);
      setDataAccessScopeKey(accessScopeKey);
      return;
    }

    let mounted = true;

    const fetchEvolucao = async () => {
      try {
        setLoading(true);
        setError(null);

        let request = evolucaoInFlight.get(currentSignature);

        if (!request) {
          request = fetchDashboardEvolucaoData(stableFilterPayload, anoEvolucao);
          evolucaoInFlight.set(currentSignature, request);
        }

        const result = await request;

        setTimedCacheValue(evolucaoCache, currentSignature, result, evolucaoCachePolicy);

        if (!mounted) return;

        setEvolucaoMensal(result.mensalData);
        setEvolucaoSemanal(result.semanalData);
        setUtrSemanal(result.utrData);
        setResolvedSignature(currentSignature);
        setDataSignature(currentSignature);
        setDataOrganizationId(currentOrganizationId);
        setDataAccessScopeKey(accessScopeKey);
      } catch (err: unknown) {
        if (mounted) {
          safeLog.error('[useDashboardEvolucao] Erro ao buscar evolucao:', err);
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
          setResolvedSignature(currentSignature);
        }
      } finally {
        evolucaoInFlight.delete(currentSignature);
        if (mounted) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEvolucao, hasVisibleDataRef.current ? DELAYS.DEBOUNCE : 0);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [accessScopeKey, anoEvolucao, currentOrganizationId, currentSignature, filterPayloadKey, isOrgLoading, refreshVersion, stableFilterPayload]);

  useEffect(() => {
    const handleRefresh = () => {
      evolucaoCache.clear();
      setResolvedSignature(null);
      setRefreshVersion((version) => version + 1);
    };

    window.addEventListener(ENTREGADORES_REFRESH_COMPLETE_EVENT, handleRefresh);
    return () => window.removeEventListener(ENTREGADORES_REFRESH_COMPLETE_EVENT, handleRefresh);
  }, []);

  const refetch = useCallback(() => {
    const payload = stableFilterPayloadRef.current?.payload || filterPayload;
    const scopeOrganizationId = typeof payload.p_organization_id === 'string'
      ? payload.p_organization_id.trim() || organizationId || null
      : organizationId || null;
    const signature = createRequestKey({ filterPayload: payload, organizationId: scopeOrganizationId, accessScopeKey, anoEvolucao });
    evolucaoCache.delete(signature);
    setResolvedSignature(null);
    setRefreshVersion((version) => version + 1);
  }, [accessScopeKey, anoEvolucao, filterPayload, organizationId]);

  const isWaitingForCurrentRequest = Boolean(anoEvolucao)
    && (isOrgLoading || resolvedSignature !== currentSignature);
  const canShowCurrentRequestData = dataSignature === currentSignature
    && dataOrganizationId === currentOrganizationId
    && dataAccessScopeKey === accessScopeKey;
  const isEvolucaoLoading = loading || isWaitingForCurrentRequest;
  useTopLoaderSync(isEvolucaoLoading);

  return {
    evolucaoMensal: canShowCurrentRequestData ? evolucaoMensal : [],
    evolucaoSemanal: canShowCurrentRequestData ? evolucaoSemanal : [],
    utrSemanal: canShowCurrentRequestData ? utrSemanal : [],
    hasCurrentData: canShowCurrentRequestData,
    loading: isEvolucaoLoading,
    error: resolvedSignature === currentSignature ? error : null,
    refetch
  };
}
