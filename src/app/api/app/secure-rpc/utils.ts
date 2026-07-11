import { CurrentUserProfile, hasElevatedRole } from '@/app/api/_shared/currentUserProfile';
import {
  ORG_PARAM_BY_RPC,
  RPCS_WITHOUT_CITY_SCOPE,
  RPCS_SUPPORTING_PRACAS_ARRAY,
  INTERNAL_SCOPED_PRACAS_PARAM,
  DASHBOARD_ROW_SUM_FIELDS,
  DASHBOARD_TOTAL_SUM_FIELDS,
  DASHBOARD_NESTED_TOTAL_SUM_FIELDS,
  DASHBOARD_ARRAY_FIELDS,
  DASHBOARD_ALIAS_BY_OUTPUT
} from './constants';

export function asParams(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export function normalizeRole(profile: CurrentUserProfile) {
  return String(profile.role || '').toLowerCase();
}

export function hasFullCityAccess(profile: CurrentUserProfile) {
  const role = normalizeRole(profile);
  return hasElevatedRole(profile) || role === 'marketing';
}

export function normalizePracaKey(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function isAllPraca(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'todas' || normalized === 'todos' || normalized === 'all';
}

export function splitPracas(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitPracas(item));
  }

  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && !isAllPraca(item));
}

export function uniquePracas(pracas: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const praca of pracas) {
    const key = normalizePracaKey(praca);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(praca);
  }

  return unique;
}

export function asDashboardRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === 'object' ? first as Record<string, unknown> : {};
  }

  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export function toFiniteNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

export function recomputeDashboardMetricRow(row: Record<string, unknown>) {
  const segundosPlanejados = toFiniteNumber(row.segundos_planejados);
  const segundosRealizados = toFiniteNumber(row.segundos_realizados);
  const ofertadas = toFiniteNumber(row.corridas_ofertadas);
  const aceitas = toFiniteNumber(row.corridas_aceitas);
  const ped1 = toFiniteNumber(row.numero_de_pedidos_aceitos_e_concluidos);
  const ped2 = toFiniteNumber(row.pedidos_aceitos_e_concluidos);
  const ped3 = toFiniteNumber(row.total_pedidos_aceitos_e_concluidos);
  
  const completadas = ped1 > 0 ? ped1 : ped2 > 0 ? ped2 : ped3;

  row.aderencia_percentual = percentage(segundosRealizados, segundosPlanejados);
  row.taxa_aceitacao = percentage(aceitas, ofertadas);
  row.taxa_completude = percentage(completadas, aceitas);

  if ('segundos_planejados' in row) row.horas_a_entregar = formatSeconds(segundosPlanejados);
  if ('segundos_realizados' in row) row.horas_entregues = formatSeconds(segundosRealizados);

  return row;
}

export function getDashboardRowKey(row: Record<string, unknown>, keyFields: string[]) {
  return keyFields
    .map((field) => String(row[field] ?? ''))
    .join('|');
}

export function mergeDashboardRows(rows: Record<string, unknown>[], keyFields: string[]) {
  const grouped = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const key = getDashboardRowKey(row, keyFields);
    const current = grouped.get(key);

    if (!current) {
      const nextRow = { ...row };
      for (const field of DASHBOARD_ROW_SUM_FIELDS) {
        if (field in nextRow) nextRow[field] = toFiniteNumber(nextRow[field]);
      }
      grouped.set(key, nextRow);
      continue;
    }

    for (const field of DASHBOARD_ROW_SUM_FIELDS) {
      if (field in row || field in current) {
        current[field] = toFiniteNumber(current[field]) + toFiniteNumber(row[field]);
      }
    }
  }

  return Array.from(grouped.values()).map(recomputeDashboardMetricRow);
}

export function mergeDashboardDimensions(records: Record<string, unknown>[]) {
  const dimensionKeys = ['anos', 'semanas', 'pracas', 'sub_pracas', 'origens', 'turnos'];
  const dimensions: Record<string, unknown[]> = {};

  for (const key of dimensionKeys) {
    const seen = new Set<string>();
    const values: unknown[] = [];

    for (const record of records) {
      const recordDimensions = record.dimensoes && typeof record.dimensoes === 'object'
        ? record.dimensoes as Record<string, unknown>
        : {};
      const items = Array.isArray(recordDimensions[key]) ? recordDimensions[key] as unknown[] : [];

      for (const item of items) {
        const itemKey = String(item);
        if (seen.has(itemKey)) continue;
        seen.add(itemKey);
        values.push(item);
      }
    }

    dimensions[key] = values;
  }

  return dimensions;
}

export function mergeDashboardResumoResults(results: unknown[]) {
  const records = results.map(asDashboardRecord).filter((record) => Object.keys(record).length > 0);
  const merged: Record<string, unknown> = {
    total_ofertadas: 0,
    total_aceitas: 0,
    total_completadas: 0,
    total_rejeitadas: 0,
    aderencia_semanal: [],
    aderencia_dia: [],
    aderencia_turno: [],
    aderencia_sub_praca: [],
    aderencia_origem: [],
    aderencia_dia_origem: [],
    dimensoes: { anos: [], semanas: [], pracas: [], sub_pracas: [], origens: [], turnos: [] },
  };

  if (records.length === 0) return merged;

  for (const record of records) {
    for (const field of DASHBOARD_TOTAL_SUM_FIELDS) {
      if (field in record || field in merged) {
        merged[field] = toFiniteNumber(merged[field]) + toFiniteNumber(record[field]);
      }
    }

    const totals = record.totais && typeof record.totais === 'object'
      ? record.totais as Record<string, unknown>
      : {};
    const mergedTotals = merged.totais && typeof merged.totais === 'object'
      ? merged.totais as Record<string, unknown>
      : {};

    for (const field of DASHBOARD_NESTED_TOTAL_SUM_FIELDS) {
      mergedTotals[field] = toFiniteNumber(mergedTotals[field]) + toFiniteNumber(totals[field]);
    }

    merged.totais = mergedTotals;
  }

  merged.dimensoes = mergeDashboardDimensions(records);

  for (const field of DASHBOARD_ARRAY_FIELDS) {
    const rows = records.flatMap((record) =>
      field.aliases.flatMap((alias) => {
        const value = record[alias];
        return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[] : [];
      })
    );

    const mergedRows = mergeDashboardRows(rows, field.keys);
    merged[field.outputKey] = mergedRows;
    merged[DASHBOARD_ALIAS_BY_OUTPUT[field.outputKey]] = mergedRows;
  }

  return merged;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function mergeEvolutionRows(
  rows: Record<string, unknown>[],
  keyFields: string[],
  labelFields: string[],
) {
  const grouped = new Map<string, Record<string, unknown>>();
  const numericFields = [
    'total_corridas',
    'corridas_completadas',
    'corridas_ofertadas',
    'corridas_aceitas',
    'corridas_rejeitadas',
    'total_segundos',
  ];

  for (const row of rows) {
    const key = getDashboardRowKey(row, keyFields);
    const current = grouped.get(key);

    if (!current) {
      const nextRow = { ...row };
      for (const field of numericFields) {
        if (field in nextRow) nextRow[field] = toFiniteNumber(nextRow[field]);
      }
      grouped.set(key, nextRow);
      continue;
    }

    for (const field of keyFields) {
      if (!(field in current) && field in row) current[field] = row[field];
    }

    for (const field of labelFields) {
      if (!current[field] && row[field]) current[field] = row[field];
    }

    for (const field of numericFields) {
      if (field in row || field in current) {
        current[field] = toFiniteNumber(current[field]) + toFiniteNumber(row[field]);
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const anoA = toFiniteNumber(a.ano);
    const anoB = toFiniteNumber(b.ano);
    if (anoA !== anoB) return anoA - anoB;

    const periodField = keyFields.includes('mes') ? 'mes' : 'semana';
    return toFiniteNumber(a[periodField]) - toFiniteNumber(b[periodField]);
  });
}

function mergeEvolutionUtrRows(rows: Record<string, unknown>[]) {
  const grouped = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const key = getDashboardRowKey(row, ['ano', 'semana']);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        ...row,
        tempo_horas: toFiniteNumber(row.tempo_horas),
        total_corridas: toFiniteNumber(row.total_corridas),
      });
      continue;
    }

    if (!current.semana_label && row.semana_label) current.semana_label = row.semana_label;
    current.tempo_horas = toFiniteNumber(current.tempo_horas) + toFiniteNumber(row.tempo_horas);
    current.total_corridas = toFiniteNumber(current.total_corridas) + toFiniteNumber(row.total_corridas);
  }

  return Array.from(grouped.values())
    .map((row): Record<string, unknown> => {
      const tempoHoras = toFiniteNumber(row.tempo_horas);
      const totalCorridas = toFiniteNumber(row.total_corridas);

      return {
        ...row,
        tempo_horas: tempoHoras,
        total_corridas: totalCorridas,
        utr: tempoHoras > 0 ? totalCorridas / tempoHoras : 0,
      };
    })
    .sort((a, b) => {
      const anoA = toFiniteNumber(a.ano);
      const anoB = toFiniteNumber(b.ano);
      if (anoA !== anoB) return anoA - anoB;
      return toFiniteNumber(a.semana) - toFiniteNumber(b.semana);
    });
}

export function mergeDashboardEvolucaoBundleResults(results: unknown[]) {
  const bundles = results
    .map(asDashboardRecord)
    .filter((record) => Object.keys(record).length > 0);

  return {
    mensal: mergeEvolutionRows(
      bundles.flatMap((bundle) => asRecordArray(bundle.mensal)),
      ['ano', 'mes'],
      ['mes_nome'],
    ),
    semanal: mergeEvolutionRows(
      bundles.flatMap((bundle) => asRecordArray(bundle.semanal)),
      ['ano', 'semana'],
      ['semana_label'],
    ),
    utr: mergeEvolutionUtrRows(
      bundles.flatMap((bundle) => asRecordArray(bundle.utr)),
    ),
  };
}

export function getInternalScopedPracas(params: Record<string, unknown>) {
  const value = params[INTERNAL_SCOPED_PRACAS_PARAM];
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export function stripInternalParams(params: Record<string, unknown>) {
  const nextParams = { ...params };
  delete nextParams[INTERNAL_SCOPED_PRACAS_PARAM];
  return nextParams;
}

export function clampPagination(params: Record<string, unknown>) {
  const nextParams = { ...params };

  if ('p_limit' in nextParams) {
    const limit = Number(nextParams.p_limit);
    nextParams.p_limit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 200) : 50;
  }

  if ('p_offset' in nextParams) {
    const offset = Number(nextParams.p_offset);
    nextParams.p_offset = Number.isFinite(offset) ? Math.min(Math.max(Math.trunc(offset), 0), 100000) : 0;
  }

  return nextParams;
}
