import type { RpcParams, RpcResult } from '@/types/rpc';
import { buildAppAuthHeaders } from '@/utils/app/appAuthHeaders';
import { INTERNAL_FETCH_OPTIONS, JSON_HEADERS } from '@/utils/app/internalFetchOptions';

const SECURE_RPC_FUNCTIONS = new Set([
  'dashboard_evolucao_bundle',
  'dashboard_resumo',
  'get_available_weeks',
  'get_city_last_updates',
  'get_current_user_profile',
  'get_dashboard_dimension_options',
  'get_entregador_detail',
  'get_entregadores_details',
  'get_gamification_leaderboard',
  'get_marketing_atendentes_data',
  'get_marketing_comparison_weekly',
  'get_marketing_resultados_data',
  'get_origens_by_praca',
  'get_subpracas_by_praca',
  'get_turnos_by_praca',
  'get_valores_cidade_resumo',
  'is_global_admin',
  'list_pracas_disponiveis',
  'listar_anos_disponiveis',
  'listar_todas_semanas',
]);

type SecureRpcResponse<T> = {
  data?: T | null;
  error?: string | null;
  details?: unknown;
};

export function shouldUseSecureRpcProxy(functionName: string) {
  return typeof window !== 'undefined' && SECURE_RPC_FUNCTIONS.has(functionName);
}

export async function executeSecureRpcProxy<T>(
  functionName: string,
  params: RpcParams | undefined,
  timeout: number
): Promise<RpcResult<T>> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/app/secure-rpc', {
      method: 'POST',
      ...INTERNAL_FETCH_OPTIONS,
      headers: await buildAppAuthHeaders(JSON_HEADERS),
      signal: controller.signal,
      body: JSON.stringify({ functionName, params: params || {} }),
    });

    const payload = await response.json().catch(() => null) as SecureRpcResponse<T> | null;

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: payload?.error || 'Erro ao consultar dados protegidos.',
          details: typeof payload?.details === 'string' ? payload.details : undefined,
        },
      };
    }

    return {
      data: (payload?.data ?? null) as T | null,
      error: null,
    };
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    return {
      data: null,
      error: {
        message: isAbort ? 'Tempo limite excedido na consulta protegida.' : 'Erro ao consultar dados protegidos.',
        code: isAbort ? 'TIMEOUT' : 'SECURE_RPC_ERROR',
      },
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
