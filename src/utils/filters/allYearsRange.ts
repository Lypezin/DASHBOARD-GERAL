import { VALIDATION } from '@/constants/config';
import type { FilterPayload } from '@/types/filters';

export function getLocalTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getAllYearsDateRange() {
  return {
    dataInicial: VALIDATION.MIN_DATE,
    dataFinal: getLocalTodayDateString(),
  };
}

export function isAllYearsPayload(payload: FilterPayload) {
  return payload.p_filtro_modo !== 'intervalo'
    && payload.p_ano == null
    && !payload.p_data_inicial
    && !payload.p_data_final;
}

export function hasImplicitSingleYearSelection(payload: FilterPayload) {
  return payload.p_filtro_modo !== 'intervalo'
    && typeof payload.p_ano === 'number'
    && payload.p_ano > 0
    && (payload.p_semana == null || payload.p_semana === 0)
    && (!Array.isArray(payload.p_semanas) || payload.p_semanas.length === 0)
    && !payload.p_data_inicial
    && !payload.p_data_final;
}

export function applyAllYearsDateRangeToPayload(payload: FilterPayload): FilterPayload {
  if (!isAllYearsPayload(payload)) return payload;

  const range = getAllYearsDateRange();

  return {
    ...payload,
    p_semana: null,
    p_semanas: null,
    p_data_inicial: range.dataInicial,
    p_data_final: range.dataFinal,
  };
}

export function expandImplicitSingleYearToDateRange(payload: FilterPayload): FilterPayload {
  if (!hasImplicitSingleYearSelection(payload)) return payload;

  const year = Number(payload.p_ano);

  return {
    ...payload,
    p_semana: null,
    p_semanas: null,
    p_data_inicial: `${year}-01-01`,
    p_data_final: `${year}-12-31`,
  };
}
