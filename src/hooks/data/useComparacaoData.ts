import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAllWeeks } from '@/hooks/comparacao/useAllWeeks';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { fetchComparisonUtr } from '@/hooks/comparacao/useComparisonUtr';
import { createRequestKey } from '@/utils/request/createRequestKey';
import { createAccessScopeKey } from '@/utils/request/createAccessScopeKey';

interface UseComparacaoDataOptions {
  semanas: string[];
  semanasSelecionadas: string[];
  pracaSelecionada: string | null;
  currentUser: CurrentUser | null;
  anoSelecionado?: number;
}

interface ComparacaoDataResult {
  dadosComparacao: DashboardResumoData[];
  utrComparacao: Array<{ semana: string | number; utr: UtrData | null }>;
  error: string | null;
  utrError: string | null;
}

const COMPARACAO_CACHE_TTL_MS = 5 * 60 * 1000;
const comparacaoDataCache = new Map<string, { timestamp: number; data: ComparacaoDataResult }>();
const comparacaoDataRequests = new Map<string, Promise<ComparacaoDataResult>>();

function createComparacaoCacheKey(
  semanasSelecionadas: string[],
  pracaSelecionada: string | null,
  accessScopeKey: string,
  organizationId: string | null,
  anoSelecionado?: number
) {
  return createRequestKey({
    organizationId: organizationId || 'no-org',
    anoSelecionado: anoSelecionado || null,
    pracaSelecionada: pracaSelecionada || 'todas',
    semanasSelecionadas,
    accessScopeKey,
  });
}

function getCachedComparacaoData(cacheKey: string) {
  const cached = comparacaoDataCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > COMPARACAO_CACHE_TTL_MS) {
    comparacaoDataCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

async function fetchComparacaoDataWithDedupe(
  requestKey: string,
  cacheKey: string,
  semanasSelecionadas: string[],
  pracaSelecionada: string | null,
  currentUser: CurrentUser | null,
  organizationId: string | null,
  anoSelecionado?: number
) {
  const activeRequest = comparacaoDataRequests.get(requestKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const [metricsResult, utrResult] = await Promise.all([
      fetchComparisonMetrics(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado)
        .then((data) => ({ data, error: null as string | null }))
        .catch((error: unknown) => ({
          data: [] as DashboardResumoData[],
          error: getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.',
        })),
      fetchComparisonUtr(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
    ]);

    const result = {
      dadosComparacao: metricsResult.data,
      utrComparacao: utrResult.data,
      error: metricsResult.error,
      utrError: utrResult.error,
    };
    if (!result.error && !result.utrError) {
      comparacaoDataCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result,
      });
    }

    return result;
  })().finally(() => {
    comparacaoDataRequests.delete(requestKey);
  });

  comparacaoDataRequests.set(requestKey, request);
  return request;
}

export function useComparacaoData(options: UseComparacaoDataOptions) {
  const { semanasSelecionadas, pracaSelecionada, currentUser, semanas, anoSelecionado } = options;
  const { organizationId, isLoading: isOrgLoading } = useOrganization();
  const currentOrganizationId = organizationId || currentUser?.organization_id || null;
  const accessScopeKey = createAccessScopeKey(currentUser, currentOrganizationId);
  const cacheKey = useMemo(() => createComparacaoCacheKey(
    semanasSelecionadas,
    pracaSelecionada,
    accessScopeKey,
    currentOrganizationId,
    anoSelecionado
  ), [accessScopeKey, anoSelecionado, currentOrganizationId, pracaSelecionada, semanasSelecionadas]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<Array<{ semana: string | number; utr: UtrData | null }>>([]);
  const [resolvedCacheKey, setResolvedCacheKey] = useState<string | null>(null);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [dataAccessScopeKey, setDataAccessScopeKey] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;
  const hasVisibleDataRef = useRef(false);

  const { todasSemanas, loadingSemanas, errorSemanas, retrySemanas } = useAllWeeks(semanas, anoSelecionado);

  hasVisibleDataRef.current = dataOrganizationId === currentOrganizationId
    && dataAccessScopeKey === accessScopeKey
    && (dadosComparacao.length > 0 || utrComparacao.length > 0);

  useEffect(() => {
    if (isOrgLoading) {
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      if (!semanasSelecionadas || semanasSelecionadas.length !== 2) {
        setDadosComparacao([]);
        setUtrComparacao([]);
        setError(null);
        setUtrError(null);
        setResolvedCacheKey(null);
        setDataOrganizationId(null);
        setDataAccessScopeKey(null);
        setLoading(false);
        return;
      }

      const cached = getCachedComparacaoData(cacheKey);
      if (cached) {
        setDadosComparacao(cached.dadosComparacao);
        setUtrComparacao(cached.utrComparacao);
        setUtrError(cached.utrError);
        setResolvedCacheKey(cacheKey);
        setDataOrganizationId(currentOrganizationId);
        setDataAccessScopeKey(accessScopeKey);
        setError(null);
        setLoading(false);
        return;
      }

      const hasVisibleData = hasVisibleDataRef.current;
      setLoading(true);
      setError(null);
      setUtrError(null);

      try {
        const nextData = await fetchComparacaoDataWithDedupe(
          `${cacheKey}:${retryNonce}`,
          cacheKey,
          semanasSelecionadas,
          pracaSelecionada,
          currentUser,
          currentOrganizationId,
          anoSelecionado
        );

        if (!isMounted) return;

        setDadosComparacao(nextData.dadosComparacao);
        setUtrComparacao(nextData.utrComparacao);
        setError(nextData.error);
        setUtrError(nextData.utrError);
        setResolvedCacheKey(cacheKey);
        setDataOrganizationId(currentOrganizationId);
        setDataAccessScopeKey(accessScopeKey);
      } catch (error: unknown) {
        safeLog.error('[Comparacao] Erro ao buscar dados:', error);
        if (isMounted) {
          setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
          setResolvedCacheKey(cacheKey);
          setDataOrganizationId(currentOrganizationId);
          setDataAccessScopeKey(accessScopeKey);
          if (!hasVisibleData) {
            setDadosComparacao([]);
            setUtrComparacao([]);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [accessScopeKey, anoSelecionado, cacheKey, currentUser, currentOrganizationId, isOrgLoading, pracaSelecionada, retryNonce, semanasSelecionadas]);

  const retryData = useCallback(() => {
    comparacaoDataCache.delete(cacheKeyRef.current);
    setRetryNonce((current) => current + 1);
  }, []);

  const hasValidComparisonSelection = Boolean(semanasSelecionadas && semanasSelecionadas.length === 2);
  const canShowCurrentOrganizationData = dataOrganizationId === currentOrganizationId
    && dataAccessScopeKey === accessScopeKey;

  return {
    loading: loading || isOrgLoading || (hasValidComparisonSelection && resolvedCacheKey !== cacheKey),
    error: resolvedCacheKey === cacheKey ? error : null,
    utrError: resolvedCacheKey === cacheKey ? utrError : null,
    dadosComparacao: canShowCurrentOrganizationData ? dadosComparacao : [],
    utrComparacao: canShowCurrentOrganizationData ? utrComparacao : [],
    todasSemanas,
    loadingSemanas,
    errorSemanas,
    retrySemanas,
    retryData,
  };
}
