/**
 * Utilitários para otimização de queries e redução de Disk IO
 * 
 * ⚠️ IMPORTANTE: Estas funções garantem que queries grandes sempre tenham
 * filtros de data para evitar scans completos na tabela dados_corridas (1.6M linhas)
 */

import { safeLog } from '@/lib/errorHandler';
import type { FilterPayload } from '@/types/filters';

/**
 * Verifica se há filtro de data no payload
 */
export function hasDateFilter(payload: FilterPayload): boolean {
  return !!(
    payload.p_data_inicial ||
    payload.p_data_final ||
    payload.p_ano ||
    (payload.p_semana && payload.p_ano)
  );
}

/**
 * Adiciona filtro de data padrão seguro se não houver filtro explícito
 * 
 * Filtro padrão: últimos 30 dias (reduz drasticamente o número de linhas lidas)
 * 
 * ⚠️ Esta função NÃO bloqueia queries, apenas adiciona um filtro seguro
 * para evitar scans completos na tabela de 1.6M linhas
 */
export function ensureDateFilter(payload: FilterPayload): FilterPayload & { _dateFilterAutoAdded?: boolean } {
  // Se já tem filtro de data, retorna sem modificar
  if (hasDateFilter(payload)) {
    return payload;
  }

  // Adiciona filtro padrão: últimos 30 dias
  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje);
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const payloadComFiltro = {
    ...payload,
    p_data_inicial: trintaDiasAtras.toISOString().split('T')[0],
    p_data_final: hoje.toISOString().split('T')[0],
    _dateFilterAutoAdded: true, // Flag para identificar filtro automático
  };

  // Log apenas em desenvolvimento para não poluir logs em produção
  if (process.env.NODE_ENV === 'development') {
    safeLog.warn(
      '⚠️ Query sem filtro de data explícito - aplicando filtro padrão (últimos 30 dias)',
      { payload: Object.keys(payload) }
    );
  }

  return payloadComFiltro;
}

/**
 * Valida se a query tem filtro de data (apenas para logging/warning)
 * 
 * Esta função NÃO bloqueia queries, apenas registra warning
 */
export function validateDateFilter(payload: FilterPayload, context: string = 'query'): void {
  if (!hasDateFilter(payload)) {
    safeLog.warn(
      `⚠️ [DISK IO] ${context} executada sem filtro de data explícito - pode causar scan completo na tabela`,
      { 
        context,
        payloadKeys: Object.keys(payload),
        recommendation: 'Sempre incluir filtro de data (p_data_inicial, p_data_final, p_ano ou p_semana)'
      }
    );
  }
}

/**
 * Aplica filtro de data padrão em uma query Supabase
 * 
 * @param query - Query Supabase builder
 * @param payload - Payload com filtros
 * @param dateColumn - Nome da coluna de data (padrão: 'data_do_periodo')
 * @returns Query com filtro de data aplicado
 */
// Supabase query builder type is complex - using any is acceptable here
export function applySafeDateFilter(
  query: any,
  payload: FilterPayload,
  dateColumn: string = 'data_do_periodo'
): typeof query {
  const payloadComFiltro = ensureDateFilter(payload);

  // Aplica filtros de data se existirem
  if (payloadComFiltro.p_data_inicial) {
    query = query.gte(dateColumn, payloadComFiltro.p_data_inicial);
  }

  if (payloadComFiltro.p_data_final) {
    query = query.lte(dateColumn, payloadComFiltro.p_data_final);
  }

  // Se foi adicionado filtro automático, logar em dev
  if (payloadComFiltro._dateFilterAutoAdded && process.env.NODE_ENV === 'development') {
    safeLog.info(
      `✅ Filtro de data padrão aplicado: ${payloadComFiltro.p_data_inicial} até ${payloadComFiltro.p_data_final}`
    );
  }

  return query;
}

