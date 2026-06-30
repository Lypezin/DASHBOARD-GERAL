import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardResumoData, UtrData, CurrentUser } from '@/types';
import { getSafeErrorMessage, safeLog } from '@/lib/errorHandler';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAllWeeks } from '@/hooks/comparacao/useAllWeeks';
import { fetchComparisonMetrics } from '@/hooks/comparacao/useComparisonMetrics';
import { fetchComparisonUtr } from '@/hooks/comparacao/useComparisonUtr';
import { createRequestKey } from '@/utils/request/createRequestKey';

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
}

const COMPARACAO_CACHE_TTL_MS = 5 * 60 * 1000;
const comparacaoDataCache = new Map<string, { timestamp: number; data: ComparacaoDataResult }>();
const comparacaoDataRequests = new Map<string, Promise<ComparacaoDataResult>>();

function createComparacaoCacheKey(
  semanasSelecionadas: string[],
  pracaSelecionada: string | null,
  currentUser: CurrentUser | null,
  organizationId: string | null,
  anoSelecionado?: number
) {
  return createRequestKey({
    organizationId: organizationId || 'no-org',
    anoSelecionado: anoSelecionado || null,
    pracaSelecionada: pracaSelecionada || 'todas',
    semanasSelecionadas,
    currentUser: currentUser
      ? {
          id: currentUser.id,
          is_admin: currentUser.is_admin,
          role: currentUser.role,
          organization_id: currentUser.organization_id,
          assigned_pracas: currentUser.assigned_pracas,
        }
      : null,
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
  cacheKey: string,
  semanasSelecionadas: string[],
  pracaSelecionada: string | null,
  currentUser: CurrentUser | null,
  organizationId: string | null,
  anoSelecionado?: number
) {
  const activeRequest = comparacaoDataRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const [dadosComparacao, utrComparacao] = await Promise.all([
      fetchComparisonMetrics(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
      fetchComparisonUtr(semanasSelecionadas, pracaSelecionada, currentUser, organizationId, anoSelecionado),
    ]);

    const result = { dadosComparacao, utrComparacao };
    comparacaoDataCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result,
    });

    return result;
  })().finally(() => {
    comparacaoDataRequests.delete(cacheKey);
  });

  comparacaoDataRequests.set(cacheKey, request);
  return request;
}

export function useComparacaoData(options: UseComparacaoDataOptions) {
  const { semanasSelecionadas, pracaSelecionada, currentUser, semanas, anoSelecionado } = options;
  const { organizationId, isLoading: isOrgLoading } = useOrganization();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosComparacao, setDadosComparacao] = useState<DashboardResumoData[]>([]);
  const [utrComparacao, setUtrComparacao] = useState<Array<{ semana: string | number; utr: UtrData | null }>>([]);
  const hasVisibleDataRef = useRef(false);

  const todasSemanas = useAllWeeks(semanas, anoSelecionado);
  const cacheKey = useMemo(() => createComparacaoCacheKey(
    semanasSelecionadas,
    pracaSelecionada,
    currentUser,
    organizationId,
    anoSelecionado
  ), [anoSelecionado, currentUser, organizationId, pracaSelecionada, semanasSelecionadas]);

  useEffect(() => {
    hasVisibleDataRef.current = dadosComparacao.length > 0 || utrComparacao.length > 0;
  }, [dadosComparacao.length, utrComparacao.length]);

  useEffect(() => {
    if (isOrgLoading) {
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      if (!semanasSelecionadas || semanasSelecionadas.length < 2) {
        setDadosComparacao([]);
        setUtrComparacao([]);
        setError(null);
        setLoading(false);
        return;
      }

      const cached = getCachedComparacaoData(cacheKey);
      if (cached) {
        setDadosComparacao(cached.dadosComparacao);
        setUtrComparacao(cached.utrComparacao);
        setError(null);
        setLoading(false);
        return;
      }

      const hasVisibleData = hasVisibleDataRef.current;
      setLoading(true);
      setError(null);

      try {
        const nextData = await fetchComparacaoDataWithDedupe(
          cacheKey,
          semanasSelecionadas,
          pracaSelecionada,
          currentUser,
          organizationId,
          anoSelecionado
        );

        if (!isMounted) return;

        setDadosComparacao(nextData.dadosComparacao);
        setUtrComparacao(nextData.utrComparacao);
      } catch (error: unknown) {
        safeLog.error('[Comparacao] Erro ao buscar dados:', error);
        if (isMounted) {
          setError(getSafeErrorMessage(error) || 'Erro ao comparar semanas. Tente novamente.');
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
  }, [anoSelecionado, cacheKey, currentUser, isOrgLoading, organizationId, pracaSelecionada, semanasSelecionadas]);

  return { loading: loading || isOrgLoading, error, dadosComparacao, utrComparacao, todasSemanas };
}
