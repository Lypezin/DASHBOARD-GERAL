import type { DashboardResumoData } from '@/types';

export function parseDashboardResumoResponse(value: unknown): DashboardResumoData | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;

  const record = candidate as Record<string, unknown>;
  const hasNumericFields = (source: Record<string, unknown>, keys: string[]) => keys.every((key) => {
    const field = source[key];
    return (typeof field === 'number' || typeof field === 'string')
      && String(field).trim() !== ''
      && Number.isFinite(Number(field));
  });
  const flatTotals = hasNumericFields(record, [
    'total_ofertadas', 'total_aceitas', 'total_rejeitadas', 'total_completadas',
  ]);
  const nestedTotals = record.totais !== null && typeof record.totais === 'object'
    && hasNumericFields(record.totais as Record<string, unknown>, [
      'corridas_ofertadas', 'corridas_aceitas', 'corridas_rejeitadas', 'corridas_completadas',
    ]);
  const collectionGroups = [
    ['aderencia_semanal', 'semanal'],
    ['aderencia_dia', 'dia'],
    ['aderencia_turno', 'turno'],
    ['aderencia_sub_praca', 'sub_praca'],
    ['aderencia_origem', 'origem'],
    ['aderencia_dia_origem', 'dia_origem'],
  ];
  const hasValidCollections = collectionGroups.every((keys) =>
    keys.some((key) => Array.isArray(record[key]))
  );
  const dimensions = record.dimensoes;
  const hasValidDimensions = dimensions !== null
    && typeof dimensions === 'object'
    && ['anos', 'semanas', 'pracas', 'sub_pracas', 'origens'].every((key) =>
      Array.isArray((dimensions as Record<string, unknown>)[key])
    );

  return (flatTotals || nestedTotals) && hasValidCollections && hasValidDimensions
    ? candidate as DashboardResumoData
    : null;
}
