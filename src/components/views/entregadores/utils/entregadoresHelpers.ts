import type { FilterPayload } from '@/types/filters';
import type { EntregadoresData } from '@/types';
import { applyAllYearsDateRangeToPayload } from '@/utils/filters/allYearsRange';

export function buildEntregadoresSearchPayload(filterPayload: FilterPayload, search: string): FilterPayload {
  return applyAllYearsDateRangeToPayload({
    ...filterPayload,
    p_search: search,
  });
}

export function formatDateLabel(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function resolveEntregadoresDescription(
  filterPayload: FilterPayload | undefined,
  periodoResolvido: EntregadoresData['periodo_resolvido'] | undefined,
  fallback: string
) {
  if (!filterPayload) return fallback;

  if (periodoResolvido?.auto_semana && periodoResolvido.semana && periodoResolvido.ano) {
    return `Performance da frota na semana ${periodoResolvido.semana} de ${periodoResolvido.ano}`;
  }

  const selectedWeeks = Array.isArray(filterPayload.p_semanas) ? filterPayload.p_semanas.filter(Boolean) : [];
  const hasExplicitWeek = typeof filterPayload.p_semana === 'number' && filterPayload.p_semana > 0;
  const hasDateRange = Boolean(filterPayload.p_data_inicial || filterPayload.p_data_final);

  if (typeof filterPayload.p_ano === 'number' && !hasExplicitWeek && selectedWeeks.length === 0 && hasDateRange) {
    return `Consolidado do ano inteiro de ${filterPayload.p_ano}`;
  }

  if (typeof filterPayload.p_ano === 'number' && selectedWeeks.length > 1) {
    return `Consolidado das semanas selecionadas de ${filterPayload.p_ano}`;
  }

  if (!filterPayload.p_ano && hasDateRange) {
    const start = formatDateLabel(filterPayload.p_data_inicial);
    const end = formatDateLabel(filterPayload.p_data_final);
    if (start && end) {
      if (start === '01/01/2020') {
        return fallback;
      }
      return `Consolidado de ${start} até ${end}`;
    }
    return 'Consolidado dos anos disponíveis no período carregado';
  }

  return fallback;
}
