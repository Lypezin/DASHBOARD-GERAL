import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { is500Error, isRateLimitError, isTimeoutError } from '@/lib/rpcErrorHandler';
import { EntregadoresData, Entregador } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';
import { fetchEntregadoresFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';

interface FetchOptions {
    filterPayload: FilterPayload;
}

function normalizeNumber(value: unknown) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function isMojibakeName(name: string) {
    return /[\u00C2\u00C3]/.test(name);
}

function chooseDisplayName(current: string, next: string) {
    const cleanCurrent = current.trim();
    const cleanNext = next.trim();

    if (!cleanCurrent) return cleanNext;
    if (!cleanNext) return cleanCurrent;
    if (isMojibakeName(cleanCurrent) && !isMojibakeName(cleanNext)) return cleanNext;
    if (!isMojibakeName(cleanCurrent) && isMojibakeName(cleanNext)) return cleanCurrent;
    return cleanNext.length > cleanCurrent.length ? cleanNext : cleanCurrent;
}

function mergeEntregadoresById(entregadores: Entregador[]) {
    const merged = new Map<string, Entregador>();

    for (const entregador of entregadores) {
        const id = String(entregador.id_entregador || '').trim();
        if (!id) continue;

        const current = merged.get(id);
        if (!current) {
            merged.set(id, {
                ...entregador,
                id_entregador: id,
                nome_entregador: String(entregador.nome_entregador || id).trim() || id,
                corridas_ofertadas: normalizeNumber(entregador.corridas_ofertadas),
                corridas_aceitas: normalizeNumber(entregador.corridas_aceitas),
                corridas_rejeitadas: normalizeNumber(entregador.corridas_rejeitadas),
                corridas_completadas: normalizeNumber(entregador.corridas_completadas),
                total_segundos: normalizeNumber(entregador.total_segundos),
                aderencia_percentual: normalizeNumber(entregador.aderencia_percentual),
                rejeicao_percentual: normalizeNumber(entregador.rejeicao_percentual),
            });
            continue;
        }

        current.nome_entregador = chooseDisplayName(current.nome_entregador, String(entregador.nome_entregador || id));
        current.corridas_ofertadas += normalizeNumber(entregador.corridas_ofertadas);
        current.corridas_aceitas += normalizeNumber(entregador.corridas_aceitas);
        current.corridas_rejeitadas += normalizeNumber(entregador.corridas_rejeitadas);
        current.corridas_completadas += normalizeNumber(entregador.corridas_completadas);
        current.total_segundos += normalizeNumber(entregador.total_segundos);

        current.aderencia_percentual = current.corridas_ofertadas > 0
            ? (current.corridas_aceitas / current.corridas_ofertadas) * 100
            : 0;
        current.rejeicao_percentual = current.corridas_ofertadas > 0
            ? (current.corridas_rejeitadas / current.corridas_ofertadas) * 100
            : 0;
    }

    return Array.from(merged.values());
}

function parseEntregadoresResponse(resultData: unknown): EntregadoresData {
    const processedData: EntregadoresData = { entregadores: [], total: 0 };

    if (!resultData) return processedData;

    let entregadores: Record<string, unknown>[] = [];

    if (typeof resultData === 'object' && !Array.isArray(resultData)) {
        const dataObject = resultData as Record<string, unknown>;
        if (Array.isArray(dataObject.entregadores)) {
            entregadores = dataObject.entregadores as Record<string, unknown>[];
            processedData.periodo_resolvido = dataObject.periodo_resolvido as EntregadoresData['periodo_resolvido'];
        } else {
            safeLog.warn('[fetchEntregadoresData] Estrutura de dados inesperada:', resultData);
        }
    } else if (Array.isArray(resultData)) {
        entregadores = resultData;
    }

    const normalizedEntregadores = mergeEntregadoresById(entregadores as unknown as Entregador[]);

    return {
        ...processedData,
        entregadores: normalizedEntregadores,
        total: normalizedEntregadores.length
    };
}

function normalizeDedicadoAderencia(data: EntregadoresData | null): EntregadoresData | null {
    if (!data) return data;

    return {
        ...data,
        entregadores: data.entregadores.map((entregador) => {
            const ofertadas = normalizeNumber(entregador.corridas_ofertadas);
            return {
                ...entregador,
                aderencia_percentual: ofertadas > 0
                    ? (normalizeNumber(entregador.corridas_completadas) / ofertadas) * 100
                    : 0,
            };
        }),
    };
}

async function fetchEntregadoresByRpc(
    rpcName: 'listar_entregadores_v2' | 'listar_entregadores_origens' | 'listar_entregadores_origens_v2',
    filterPayload: FilterPayload,
    options: { fallbackOnError: boolean }
): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    const isDedicadoRpc = rpcName === 'listar_entregadores_origens' || rpcName === 'listar_entregadores_origens_v2';
    const allowedParams = isDedicadoRpc
        ? ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_data_inicial', 'p_data_final', 'p_organization_id']
        : ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_only_dedicados', 'p_search'];
    const listarEntregadoresPayload: FilterPayload = {};

    for (const key of allowedParams) {
        if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
            listarEntregadoresPayload[key] = filterPayload[key];
        }
    }

    const result = await safeRpc<any>(rpcName, listarEntregadoresPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false
    });

    if (result.error) {
        const search = typeof listarEntregadoresPayload.p_search === 'string'
            ? listarEntregadoresPayload.p_search.trim()
            : '';
        const hasSearch = search.length >= 3;
        const emptySearchData: EntregadoresData = {
            entregadores: [],
            total: 0,
            periodo_resolvido: {
                ano: typeof listarEntregadoresPayload.p_ano === 'number' ? listarEntregadoresPayload.p_ano : null,
                semana: typeof listarEntregadoresPayload.p_semana === 'number' ? listarEntregadoresPayload.p_semana : null,
                semanas: Array.isArray(listarEntregadoresPayload.p_semanas) ? listarEntregadoresPayload.p_semanas : null,
                auto_semana: false,
                search
            }
        };
        const is500 = is500Error(result.error);
        const isRateLimit = isRateLimitError(result.error);
        const isTimeout = isTimeoutError(result.error);

        if ((is500 || isTimeout) && options.fallbackOnError) {
            try {
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
            }
        }

        if (hasSearch && (is500 || isTimeout)) {
            safeLog.error(`Busca de entregadores falhou via ${rpcName}; retornando estado vazio controlado.`, result.error);
            return { data: emptySearchData, error: null };
        }

        if (is500 && options.fallbackOnError) {
            throw new Error('RETRY_500');
        }

        if (isRateLimit) {
            throw new Error('RETRY_RATE_LIMIT');
        }

        if (isTimeout) {
            return { data: { entregadores: [], total: 0 }, error: result.error };
        }

        const errorCode = result.error?.code || '';
        const errorMessage = result.error?.message || '';

        if (options.fallbackOnError && (errorCode === '42883' || errorCode === 'PGRST116' || errorMessage.includes('does not exist'))) {
            try {
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
            }
        }

        safeLog.error(`Erro ao buscar entregadores via ${rpcName}:`, result.error);
        return { data: { entregadores: [], total: 0 }, error: result.error };
    }

    return { data: parseEntregadoresResponse(result.data), error: null };
}

/**
 * Busca dados de Entregadores
 */
export async function fetchEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    return fetchEntregadoresByRpc('listar_entregadores_v2', options.filterPayload, { fallbackOnError: true });
}

/**
 * Busca dados da subguia DEDICADO, mantendo apenas entregadores com origem/restaurante.
 */
export async function fetchDedicadoEntregadoresData(options: FetchOptions): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    const result = await fetchEntregadoresByRpc('listar_entregadores_origens_v2', options.filterPayload, { fallbackOnError: false });
    const errorCode = result.error?.code || '';
    const errorMessage = result.error?.message || '';
    const shouldTryLegacy = result.error && (
        errorCode === '42883'
        || errorCode === 'PGRST202'
        || errorMessage.includes('listar_entregadores_origens_v2')
        || errorMessage.includes('Could not find the function')
        || is500Error(result.error)
        || isTimeoutError(result.error)
    );

    if (shouldTryLegacy) {
        const legacyPayload = { ...options.filterPayload };
        delete legacyPayload.p_semanas;
        const legacyResult = await fetchEntregadoresByRpc('listar_entregadores_origens', legacyPayload, { fallbackOnError: false });
        const normalizedLegacy = normalizeDedicadoAderencia(legacyResult.data);

        if (!legacyResult.error || normalizedLegacy?.entregadores?.length) {
            return { ...legacyResult, data: normalizedLegacy };
        }
    }

    return { ...result, data: normalizeDedicadoAderencia(result.data) };
}
