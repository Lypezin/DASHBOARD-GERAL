import { safeLog } from '@/lib/errorHandler';
import { IS_DEV } from '@/constants/environment';
import type { FilterPayload } from '@/types/filters';

export function hasDateFilter(payload: FilterPayload): boolean {
  return !!(
    payload.p_data_inicial ||
    payload.p_data_final ||
    payload.p_ano ||
    (payload.p_semana && payload.p_ano)
  );
}

export function ensureDateFilter(payload: FilterPayload): FilterPayload & { _dateFilterAutoAdded?: boolean } {
  if (hasDateFilter(payload)) {
    return payload;
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const payloadWithDateFilter = {
    ...payload,
    p_data_inicial: thirtyDaysAgo.toISOString().split('T')[0],
    p_data_final: today.toISOString().split('T')[0],
    _dateFilterAutoAdded: true,
  };

  if (IS_DEV) {
    safeLog.warn(
      '[DISK IO] Query sem filtro de data explicito - aplicando filtro padrao dos ultimos 30 dias',
      { payload: Object.keys(payload) }
    );
  }

  return payloadWithDateFilter;
}

export function validateDateFilter(payload: FilterPayload, context: string = 'query'): void {
  if (!hasDateFilter(payload)) {
    safeLog.warn(
      `[DISK IO] ${context} executada sem filtro de data explicito - pode causar scan completo na tabela`,
      {
        context,
        payloadKeys: Object.keys(payload),
        recommendation: 'Sempre incluir filtro de data (p_data_inicial, p_data_final, p_ano ou p_semana)',
      }
    );
  }
}
