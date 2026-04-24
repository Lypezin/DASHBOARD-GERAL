import { useCallback, useEffect, useState } from 'react';
import { MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { CIDADES } from '@/constants/marketing';
import { AtendenteData } from './AtendenteCard';
import { ATENDENTES, ATENDENTES_FOTOS } from '@/utils/atendenteMappers';

interface TotaisData {
  totalEnviado: number;
  totalLiberado: number;
}

interface ResultadosRpcRow {
  responsavel: string;
  enviado: number;
  liberado: number;
  cidade: string;
  cidade_enviado: number;
  cidade_liberado: number;
  cidade_valor_total?: number;
  cidade_quantidade_liberados?: number;
  cidade_custo_por_liberado?: number;
  atendente_valor_total?: number;
  atendente_quantidade_liberados?: number;
  atendente_custo_por_liberado?: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const resultadosCache = new Map<string, { timestamp: number; data: ResultadosRpcRow[] }>();
const resultadosRequests = new Map<string, Promise<ResultadosRpcRow[]>>();

function buildCacheKey(
  organizationId: string | null | undefined,
  filters: {
    filtroLiberacao: MarketingDateFilter;
    filtroEnviados: MarketingDateFilter;
    filtroEnviadosLiberados: MarketingDateFilter;
  }
) {
  return JSON.stringify({
    organizationId: organizationId || 'global',
    filtroLiberacao: filters.filtroLiberacao,
    filtroEnviados: filters.filtroEnviados,
    filtroEnviadosLiberados: filters.filtroEnviadosLiberados,
  });
}

function getCachedResultados(cacheKey: string) {
  const cached = resultadosCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    resultadosCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

async function fetchResultados(cacheKey: string, params: Record<string, unknown>) {
  const activeRequest = resultadosRequests.get(cacheKey);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const { data, error } = await safeRpc<ResultadosRpcRow[]>('get_marketing_resultados_data', params, {
      timeout: 30000,
      validateParams: false,
    });

    if (error) throw error;

    const normalized = Array.isArray(data) ? data : [];
    resultadosCache.set(cacheKey, {
      timestamp: Date.now(),
      data: normalized,
    });

    return normalized;
  })().finally(() => {
    resultadosRequests.delete(cacheKey);
  });

  resultadosRequests.set(cacheKey, request);
  return request;
}

function normalizeResultados(rows: ResultadosRpcRow[]) {
  const atendentesMap = new Map<string, AtendenteData>();

  for (const atendente of ATENDENTES) {
    atendentesMap.set(atendente, {
      nome: atendente,
      enviado: 0,
      liberado: 0,
      fotoUrl: ATENDENTES_FOTOS[atendente] || null,
      cidades: CIDADES.map((cidade) => ({
        atendente,
        cidade,
        enviado: 0,
        liberado: 0,
      })),
    });
  }

  for (const row of rows) {
    if (!row.responsavel) continue;

    const atendenteData = atendentesMap.get(row.responsavel) || {
      nome: row.responsavel,
      enviado: 0,
      liberado: 0,
      fotoUrl: ATENDENTES_FOTOS[row.responsavel] || null,
      cidades: [],
    };

    atendenteData.enviado = Number(row.enviado) || 0;
    atendenteData.liberado = Number(row.liberado) || 0;
    atendenteData.valorTotal = Number(row.atendente_valor_total) || 0;
    atendenteData.quantidadeLiberados = Number(row.atendente_quantidade_liberados) || 0;
    atendenteData.custoPorLiberado = Number(row.atendente_custo_por_liberado) || 0;

    const cidades = atendenteData.cidades || [];
    const cityIndex = cidades.findIndex((cidade) => cidade.cidade === row.cidade);
    const cityPayload = {
      atendente: row.responsavel,
      cidade: row.cidade,
      enviado: Number(row.cidade_enviado) || 0,
      liberado: Number(row.cidade_liberado) || 0,
      valorTotal: Number(row.cidade_valor_total) || 0,
      quantidadeLiberados: Number(row.cidade_quantidade_liberados) || 0,
      custoPorLiberado: Number(row.cidade_custo_por_liberado) || 0,
    };

    if (cityIndex >= 0) {
      cidades[cityIndex] = cityPayload;
    } else {
      cidades.push(cityPayload);
    }

    atendenteData.cidades = cidades;
    atendentesMap.set(row.responsavel, atendenteData);
  }

  const atendentes = ATENDENTES.map((atendente) => atendentesMap.get(atendente)!).concat(
    Array.from(atendentesMap.values()).filter((item) => !ATENDENTES.includes(item.nome as typeof ATENDENTES[number]))
  );

  const totais = atendentes.reduce<TotaisData>((acc, curr) => ({
    totalEnviado: acc.totalEnviado + curr.enviado,
    totalLiberado: acc.totalLiberado + curr.liberado,
  }), { totalEnviado: 0, totalLiberado: 0 });

  return { atendentes, totais };
}

export function useResultadosData() {
  const { organization, currentUser, hasResolved } = useAppBootstrap();
  const organizationId = organization?.id || currentUser?.organization_id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atendentesData, setAtendentesData] = useState<AtendenteData[]>([]);
  const [totais, setTotais] = useState<TotaisData>({
    totalEnviado: 0,
    totalLiberado: 0,
  });
  const [filters, setFilters] = useState<{
    filtroLiberacao: MarketingDateFilter;
    filtroEnviados: MarketingDateFilter;
    filtroEnviadosLiberados: MarketingDateFilter;
  }>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
    filtroEnviadosLiberados: { dataInicial: null, dataFinal: null },
  });

  const loadData = useCallback(async () => {
    if (!hasResolved) return;

    setLoading(true);
    setError(null);

    try {
      const cacheKey = buildCacheKey(organizationId, filters);
      const rows = getCachedResultados(cacheKey) || await fetchResultados(cacheKey, {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
        data_custo_inicial: filters.filtroEnviadosLiberados.dataInicial || null,
        data_custo_final: filters.filtroEnviadosLiberados.dataFinal || null,
        p_organization_id: organizationId,
      });

      const normalized = normalizeResultados(rows);
      setAtendentesData(normalized.atendentes);
      setTotais(normalized.totais);
    } catch (err: unknown) {
      safeLog.error('Erro ao buscar dados de Resultados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de Resultados');
    } finally {
      setLoading(false);
    }
  }, [filters, hasResolved, organizationId]);

  useEffect(() => {
    if (!hasResolved) {
      setLoading(true);
      return;
    }

    void loadData();
  }, [hasResolved, loadData]);

  const handleFilterChange = (filterName: 'filtroLiberacao' | 'filtroEnviados' | 'filtroEnviadosLiberados', filter: MarketingDateFilter) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: filter,
    }));
  };

  return {
    loading,
    error,
    atendentesData,
    totais,
    filters,
    handleFilterChange
  };
}
