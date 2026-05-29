import { useEffect, useMemo, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { MarketingDateFilter, ValoresCidadeDateFilter, ValoresCidadePorCidade } from '@/types';

interface ValoresCidadeResumoRow {
  cidade: string;
  valor_total: number;
  valor_total_enviados: number;
  quantidade_liberados: number;
  custo_por_liberado: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const valoresCidadeCache = new Map<string, { timestamp: number; data: ValoresCidadeResumoRow[] }>();
const valoresCidadeRequests = new Map<string, Promise<ValoresCidadeResumoRow[]>>();

function buildCacheKey(
  organizationId: string | null | undefined,
  filter: ValoresCidadeDateFilter,
  filterEnviados: MarketingDateFilter
) {
  return JSON.stringify({
    organizationId: organizationId || 'global',
    valorInicial: filter.dataInicial,
    valorFinal: filter.dataFinal,
    enviadosInicial: filterEnviados.dataInicial,
    enviadosFinal: filterEnviados.dataFinal,
  });
}

function getCachedResumo(cacheKey: string) {
  const cached = valoresCidadeCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    valoresCidadeCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

async function fetchValoresCidadeResumo(cacheKey: string, params: Record<string, unknown>) {
  const activeRequest = valoresCidadeRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data, error } = await safeRpc<ValoresCidadeResumoRow[]>('get_valores_cidade_resumo', params, {
      timeout: 30000,
      validateParams: false,
    });

    if (error) throw error;

    const normalized = Array.isArray(data) ? data : [];
    valoresCidadeCache.set(cacheKey, {
      timestamp: Date.now(),
      data: normalized,
    });

    return normalized;
  })().finally(() => {
    valoresCidadeRequests.delete(cacheKey);
  });

  valoresCidadeRequests.set(cacheKey, request);
  return request;
}

export const useValoresCidadeData = (
  isAuthenticated: boolean,
  filter: ValoresCidadeDateFilter,
  filterEnviados: MarketingDateFilter
) => {
  const { organization, currentUser } = useAppBootstrap();
  const organizationId = organization?.id || currentUser?.organization_id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cidadesData, setCidadesData] = useState<ValoresCidadePorCidade[]>([]);
  const [quantidadeLiberados, setQuantidadeLiberados] = useState<number>(0);
  const requestPayload = useMemo(() => ({
    organizationId,
    filter,
    filterEnviados,
    cacheKey: buildCacheKey(organizationId, filter, filterEnviados),
  }), [filter, filterEnviados, organizationId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setCidadesData([]);
      setQuantidadeLiberados(0);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const { cacheKey, organizationId: payloadOrganizationId } = requestPayload;
        const cached = getCachedResumo(cacheKey);
        const rows = cached || await fetchValoresCidadeResumo(cacheKey, {
          p_organization_id: payloadOrganizationId,
          data_valores_inicial: requestPayload.filter.dataInicial || null,
          data_valores_final: requestPayload.filter.dataFinal || null,
          data_envio_inicial: requestPayload.filterEnviados.dataInicial || null,
          data_envio_final: requestPayload.filterEnviados.dataFinal || null,
        });

        if (cancelled) return;

        const normalizedRows = rows
          .map((row) => ({
            cidade: row.cidade,
            valor_total: Number(row.valor_total) || 0,
            valor_total_enviados: Number(row.valor_total_enviados) || 0,
            quantidade_liberados: Number(row.quantidade_liberados) || 0,
            custo_por_liberado: Number(row.custo_por_liberado) || 0,
          }))
          .sort((a, b) => b.valor_total - a.valor_total);

        setCidadesData(normalizedRows);
        setQuantidadeLiberados(
          normalizedRows.reduce((total, row) => total + (row.quantidade_liberados || 0), 0)
        );
      } catch (err: unknown) {
        if (cancelled) return;

        safeLog.error('Erro ao buscar dados de Valores por Cidade:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de Valores por Cidade');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    requestPayload,
  ]);

  const totalGeral = useMemo(
    () => cidadesData.reduce((sum, item) => sum + item.valor_total, 0),
    [cidadesData]
  );

  const custoPorLiberado = useMemo(() => {
    const totalValorEnviados = cidadesData.reduce((sum, item) => sum + (item.valor_total_enviados || 0), 0);
    return quantidadeLiberados > 0 ? totalValorEnviados / quantidadeLiberados : 0;
  }, [cidadesData, quantidadeLiberados]);

  return {
    loading,
    error,
    cidadesData,
    totalGeral,
    custoPorLiberado,
    quantidadeLiberados,
  };
};
