import { UtrData } from '@/types';

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function extractUtrValue(value: unknown): number | null {
  const parsed = tryParseJson(value) as Partial<UtrData> | null;

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const geral = (parsed as Record<string, unknown>).geral;

  if (geral && typeof geral === 'object' && 'utr' in geral) {
    return parseNumericUtr((geral as { utr?: unknown }).utr);
  }

  if ('utr' in (parsed as Record<string, unknown>)) {
    return parseNumericUtr((parsed as Record<string, unknown>).utr);
  }

  if ('calcular_utr' in (parsed as Record<string, unknown>)) {
    return extractUtrValue((parsed as Record<string, unknown>).calcular_utr);
  }

  if ('calcular_utr_completo' in (parsed as Record<string, unknown>)) {
    return extractUtrValue((parsed as Record<string, unknown>).calcular_utr_completo);
  }

  return null;
}

function parseNumericUtr(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}
