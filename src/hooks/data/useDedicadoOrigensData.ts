import React from 'react';
import { safeLog } from '@/lib/errorHandler';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';
import { createRequestKey } from '@/utils/request/createRequestKey';
import type { AderenciaDiaOrigem, AderenciaOrigem } from '@/types';

export type DedicadoOrigemRow = AderenciaOrigem & {
  segundos_realizados?: number;
  segundos_planejados?: number;
  taxa_aceitacao?: number;
  taxa_completude?: number;
};

export interface DedicadoOrigensPayload {
  totais?: {
    total_entregadores?: number;
    total_origens?: number;
    corridas_ofertadas?: number;
    corridas_aceitas?: number;
    corridas_rejeitadas?: number;
    corridas_completadas?: number;
    segundos_realizados?: number;
    segundos_planejados?: number;
  };
  origem?: DedicadoOrigemRow[];
  dia_origem?: AderenciaDiaOrigem[];
  periodo_resolvido?: {
    ano?: number | null;
    semana?: number | null;
    auto_semana?: boolean;
  };
}

const DEDICADO_ORIGENS_CACHE_TTL_MS = 5 * 60 * 1000;
const dedicadoOrigensCache = new Map<string, { timestamp: number; data: DedicadoOrigensPayload }>();
const dedicadoOrigensRequests = new Map<string, Promise<DedicadoOrigensPayload>>();

function getCachedDedicadoOrigens(cacheKey: string) {
  const cached = dedicadoOrigensCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > DEDICADO_ORIGENS_CACHE_TTL_MS) {
    dedicadoOrigensCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

async function fetchDedicadoOrigensWithDedupe(cacheKey: string, requestWithMode: Record<string, unknown>) {
  const activeRequest = dedicadoOrigensRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data, error } = await fetchDedicadoApi<DedicadoOrigensPayload>('summary', requestWithMode);
    if (error) throw error;

    const normalized = {
      totais: data?.totais || {},
      origem: Array.isArray(data?.origem) ? data.origem : [],
      dia_origem: Array.isArray(data?.dia_origem) ? data.dia_origem : [],
      periodo_resolvido: data?.periodo_resolvido,
    };

    dedicadoOrigensCache.set(cacheKey, {
      timestamp: Date.now(),
      data: normalized,
    });

    return normalized;
  })().finally(() => {
    dedicadoOrigensRequests.delete(cacheKey);
  });

  dedicadoOrigensRequests.set(cacheKey, request);
  return request;
}

interface UseDedicadoOrigensDataProps {
  origemPayload: Record<string, unknown>;
  shouldLoadOrigemSummary: boolean;
  shouldLoadDiaOrigem: boolean;
  origemOrganizationId: string;
}

export function useDedicadoOrigensData({
  origemPayload,
  shouldLoadOrigemSummary,
  shouldLoadDiaOrigem,
  origemOrganizationId,
}: UseDedicadoOrigensDataProps) {
  const [data, setData] = React.useState<DedicadoOrigensPayload>({ origem: [], dia_origem: [] });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const origemPayloadKey = React.useMemo(() => createRequestKey(origemPayload), [origemPayload]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchDedicadoOrigens() {
      if (!shouldLoadOrigemSummary && !shouldLoadDiaOrigem) {
        setLoading(false);
        setError(null);
        return;
      }

      if (!origemOrganizationId) {
        setLoading(false);
        setError('Selecione uma organização para carregar os dados do DEDICADO.');
        setData({ origem: [], dia_origem: [] });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const requestPayload = JSON.parse(origemPayloadKey) as Record<string, unknown>;
        const requestWithMode = {
          ...requestPayload,
          p_include_dia_origem: shouldLoadDiaOrigem,
        };
        const cacheKey = createRequestKey(requestWithMode);
        const cached = getCachedDedicadoOrigens(cacheKey);
        const resolvedData = cached || await fetchDedicadoOrigensWithDedupe(cacheKey, requestWithMode);

        if (cancelled) return;

        setData({
          totais: resolvedData?.totais || {},
          origem: Array.isArray(resolvedData?.origem) ? resolvedData.origem : [],
          dia_origem: shouldLoadDiaOrigem && Array.isArray(resolvedData?.dia_origem) ? resolvedData.dia_origem : [],
          periodo_resolvido: resolvedData?.periodo_resolvido,
        });
      } catch (err) {
        if (!cancelled) {
          safeLog.error('Erro inesperado ao carregar dedicado por origem:', err);
          setError('Erro inesperado ao carregar o DEDICADO. Tente novamente em alguns instantes.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDedicadoOrigens();

    return () => {
      cancelled = true;
    };
  }, [origemOrganizationId, origemPayloadKey, shouldLoadDiaOrigem, shouldLoadOrigemSummary]);

  return { data, loading, error };
}
