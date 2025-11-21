/**
 * Funções auxiliares para construção de queries do módulo de Marketing
 * Centralizadas para evitar duplicação e facilitar manutenção
 */

import { MarketingDateFilter } from '@/types';
import { SANTO_ANDRE_SUB_PRACAS, SAO_BERNARDO_SUB_PRACAS } from '@/constants/marketing';

/**
 * Constrói uma query com filtro de data para queries do Supabase.
 * Se não há filtro aplicado, retorna apenas registros onde a data não é null.
 * Se há filtro, aplica intervalo de datas (gte para data inicial, lte para data final).
 *
 * @param query A query do Supabase a ser modificada.
 * @param dateColumn O nome da coluna de data na tabela.
 * @param filter O filtro de data contendo dataInicial e/ou dataFinal.
 * @returns A query modificada com os filtros de data aplicados.
 * @example
 * const query = supabase.from('dados_marketing').select('*');
 * const filteredQuery = buildDateFilterQuery(query, 'data_envio', { dataInicial: '2024-01-01', dataFinal: '2024-01-31' });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildDateFilterQuery(
  query: any, // Supabase query builder type is complex, using any for now
  dateColumn: string,
  filter: MarketingDateFilter
): typeof query {
  // Se não há filtro aplicado, contar apenas registros onde a data não é null
  if (!filter.dataInicial && !filter.dataFinal) {
    query = query.not(dateColumn, 'is', null);
    return query;
  }
  
  // Se há filtro, aplicar intervalo (não aplicar not null aqui)
  if (filter.dataInicial) {
    query = query.gte(dateColumn, filter.dataInicial);
  }
  if (filter.dataFinal) {
    // Usar lte para incluir o dia final completo
    query = query.lte(dateColumn, filter.dataFinal);
  }
  
  return query;
}

/**
 * Constrói uma query com filtro de cidade para queries do Supabase.
 * Trata casos especiais para Santo André, São Bernardo e ABC 2.0.
 *
 * @param query A query do Supabase a ser modificada.
 * @param cidade O nome da cidade para filtrar.
 * @returns A query modificada com o filtro de cidade aplicado.
 * @example
 * const query = supabase.from('dados_marketing').select('*');
 * const filteredQuery = buildCityQuery(query, 'Santo André');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildCityQuery(query: any, cidade: string): typeof query { // Supabase query builder type is complex, using any for now
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

