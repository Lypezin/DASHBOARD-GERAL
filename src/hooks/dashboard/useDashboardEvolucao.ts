import { useCallback, useEffect, useRef, useState } from 'react';

import { CACHE, DELAYS } from '@/constants/config';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { safeLog } from '@/lib/errorHandler';
import type { EvolucaoMensal, EvolucaoSemanal, UtrSemanal } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { getTimedCacheValue, setTimedCacheValue, type TimedCacheEntry } from '@/utils/cache/timedLruCache';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { fetchDashboardEvolucaoData } from './utils/fetchEvolucao';

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

export function useDashboardEvolucao({ filterPayload, anoEvolucao }: UseDashboardEvolucaoOptions) {
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [evolucaoSemanal, setEvolucaoSemanal] = useState<EvolucaoSemanal[]>([]);
  const [utrSemanal, setUtrSemanal] = useState<UtrSemanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const { organizationId, isLoading: isOrgLoading } = useOrganization();
  const { currentUser } = useAppBootstrap();
  const [resolvedSignature, setResolvedSignature] = useState<string | null>(null);
  const [dataSignature, setDataSignature] = useState<string | null>(null);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [dataAccessScopeKey, setDataAccessScopeKey] = useState<string | null>(null);
  const stableFilterPayloadRef = useRef<{ key: string; payload: FilterPayload } | null>(null);
  const filterPayloadKey = createRequestKey(filterPayload);
  if (!stableFilterPayloadRef.current || stableFilterPayloadRef.current.key !== filterPayloadKey) {
    stableFilterPayloadRef.current = { key: filterPayloadKey, payload: filterPayload };
  }
  const stableFilterPayload = stableFilterPayloadRef.current.payload;
  const currentOrganizationId = typeof stableFilterPayload.p_organization_id === 'string'
    ? stableFilterPayload.p_organization_id.trim() || organizationId || null
    : organizationId || null;
  const accessScopeKey = createAccessScopeKey(currentUser, currentOrganizationId);
  const currentSignature = createRequestKey({
    filterPayload: stableFilterPayload,
    organizationId: currentOrganizationId,
    accessScopeKey,
    anoEvolucao,
  });

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

    const hasVisibleData = dataSignature === currentSignature
      && dataOrganizationId === currentOrganizationId
      && dataAccessScopeKey === accessScopeKey
      && (evolucaoMensal.length > 0 || evolucaoSemanal.length > 0 || utrSemanal.length > 0);
    const timeoutId = setTimeout(fetchEvolucao, hasVisibleData ? DELAYS.DEBOUNCE : 0);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [accessScopeKey, anoEvolucao, currentOrganizationId, currentSignature, dataAccessScopeKey, dataOrganizationId, dataSignature, filterPayloadKey, isOrgLoading, refreshVersion, stableFilterPayload, evolucaoMensal.length, evolucaoSemanal.length, utrSemanal.length]);

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

  return {
    evolucaoMensal: canShowCurrentRequestData ? evolucaoMensal : [],
    evolucaoSemanal: canShowCurrentRequestData ? evolucaoSemanal : [],
    utrSemanal: canShowCurrentRequestData ? utrSemanal : [],
    hasCurrentData: canShowCurrentRequestData,
    loading: loading || isWaitingForCurrentRequest,
    error: resolvedSignature === currentSignature ? error : null,
    refetch
  };
}
