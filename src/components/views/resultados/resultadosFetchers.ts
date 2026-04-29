import { MarketingDateFilter } from '@/types';
import { safeRpc } from '@/lib/rpcWrapper';
import { CIDADES } from '@/constants/marketing';
import { AtendenteData } from './AtendenteCard';
import { ATENDENTES, ATENDENTES_FOTOS } from '@/utils/atendenteMappers';

export interface TotaisData {
  totalEnviado: number;
  totalLiberado: number;
}

export interface ResultadosRpcRow {
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

export function buildCacheKey(
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

export function getCachedResultados(cacheKey: string) {
  const cached = resultadosCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    resultadosCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

export async function fetchResultados(cacheKey: string, params: Record<string, unknown>) {
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

export function normalizeResultados(rows: ResultadosRpcRow[]) {
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
