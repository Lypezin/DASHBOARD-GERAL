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
    const utrValue = Number((geral as { utr?: unknown }).utr);
    return Number.isFinite(utrValue) ? utrValue : 0;
  }

  if ('utr' in (parsed as Record<string, unknown>)) {
    const utrValue = Number((parsed as Record<string, unknown>).utr);
    return Number.isFinite(utrValue) ? utrValue : 0;
  }

  if ('calcular_utr' in (parsed as Record<string, unknown>)) {
    return extractUtrValue((parsed as Record<string, unknown>).calcular_utr);
  }

  if ('calcular_utr_completo' in (parsed as Record<string, unknown>)) {
    return extractUtrValue((parsed as Record<string, unknown>).calcular_utr_completo);
  }

  return null;
}

export function createEmptyUtrData(): UtrData {
  return {
    geral: {
      tempo_horas: 0,
      corridas: 0,
      utr: 0,
    },
  };
}
