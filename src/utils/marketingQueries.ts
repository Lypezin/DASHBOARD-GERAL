/**
 * Funções auxiliares para construção de queries do módulo de Marketing
 * Centralizadas para evitar duplicação e facilitar manutenção
 */

import { MarketingDateFilter } from '@/types';
import { SANTO_ANDRE_SUB_PRACAS, SAO_BERNARDO_SUB_PRACAS } from '@/constants/marketing';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Garante que um filtro de data de marketing tenha pelo menos um filtro aplicado
 * Se não houver filtro, aplica um filtro padrão dos últimos 30 dias
 */
export function ensureMarketingDateFilter(filter: MarketingDateFilter): MarketingDateFilter {
  if (filter.dataInicial || filter.dataFinal) {
    return filter;
  }

  // Se não há filtro, aplicar filtro padrão dos últimos 30 dias
  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje);
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  if (IS_DEV) {
    safeLog.warn('[ensureMarketingDateFilter] Nenhum filtro de data fornecido, aplicando filtro padrão de 30 dias');
  }

  return {
    dataInicial: trintaDiasAtras.toISOString().split('T')[0],
    dataFinal: hoje.toISOString().split('T')[0],
  };
}

/** Constrói uma query modificada com filtros de data */
export function buildDateFilterQuery(
  query: any,
  dateColumn: string,
  filter: MarketingDateFilter
): typeof query {
  const safeFilter = ensureMarketingDateFilter(filter);
  if (safeFilter.dataInicial) query = query.gte(dateColumn, safeFilter.dataInicial);
  if (safeFilter.dataFinal) query = query.lte(dateColumn, safeFilter.dataFinal);
  return query;
}

/** Constrói query modificada com filtro de localização ABC e suas sub-praças */
// Supabase query builder type is complex - using any is acceptable here
export function buildCityQuery(query: any, cidade: string): typeof query {
  if (cidade === 'Santo André') {
    return query
      .eq('regiao_atuacao', 'ABC 2.0')
      .in('sub_praca_abc', SANTO_ANDRE_SUB_PRACAS);
  } else if (cidade === 'São Bernardo') {
    return query
      .eq('regiao_atuacao', 'ABC 2.0')
      .in('sub_praca_abc', SAO_BERNARDO_SUB_PRACAS);
  } else if (cidade === 'ABC 2.0') {
    // ABC 2.0 exclui Santo André e São Bernardo
    const excludedSubPracas = [...SANTO_ANDRE_SUB_PRACAS, ...SAO_BERNARDO_SUB_PRACAS];
    let abcQuery = query.eq('regiao_atuacao', 'ABC 2.0');
    excludedSubPracas.forEach(subPraca => {
      abcQuery = abcQuery.neq('sub_praca_abc', subPraca);
    });
    abcQuery = abcQuery.not('sub_praca_abc', 'is', null);
    return abcQuery;
  } else {
    return query.eq('regiao_atuacao', cidade);
  }
}

