type RpcErrorLike = {
  code?: string | null;
  message?: string | null;
} | null | undefined;

const DEDICADO_FILTER_KEYS = [
  'p_ano',
  'p_semana',
  'p_semanas',
  'p_praca',
  'p_sub_praca',
  'p_data_inicial',
  'p_data_final',
  'p_organization_id',
] as const;

export function buildDedicadoFilterPayload(
  source: Partial<Record<(typeof DEDICADO_FILTER_KEYS)[number], unknown>> | null | undefined,
  extraPayload: Record<string, unknown> = {}
) {
  const payload: Record<string, unknown> = { ...extraPayload };

  DEDICADO_FILTER_KEYS.forEach((key) => {
    const value = source?.[key];
    if (value !== null && value !== undefined && value !== '') {
      payload[key] = value;
    }
  });

  return payload;
}

export function omitPayloadKeys(payload: Record<string, unknown>, keys: string[]) {
  const nextPayload = { ...payload };

  keys.forEach((key) => {
    delete nextPayload[key];
  });

  return nextPayload;
}

export function shouldFallbackOnMissingFunction(error: RpcErrorLike, primaryName: string) {
  const errorMessage = String(error?.message || '');

  return (
    error?.code === '42883'
    || error?.code === 'PGRST202'
    || errorMessage.includes(primaryName)
    || errorMessage.includes('Could not find the function')
  );
}

export function shouldFallbackOnLegacySummary(error: RpcErrorLike, primaryName: string) {
  const errorMessage = String(error?.message || '').toLowerCase();

  return (
    shouldFallbackOnMissingFunction(error, primaryName)
    || error?.code === '57014'
    || error?.code === 'TIMEOUT'
    || errorMessage.includes('timeout')
    || errorMessage.includes('internal server error')
  );
}
