import { safeLog } from '@/lib/errorHandler';
import { is500Error, isRateLimitError, isTimeoutError } from '@/lib/rpcErrorHandler';
import { EntregadoresData, Entregador } from '@/types';
import { fetchEntregadoresFallback } from '../fallbacks';
import type { FilterPayload } from '@/types/filters';
import type { RpcError } from '@/types/rpc';
import { expandImplicitSingleYearToDateRange } from '@/utils/filters/allYearsRange';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';
import { fetchDashboardDataApi } from '@/utils/dashboard/fetchDashboardDataApi';

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

function chooseEarliestDate(current?: string | null, next?: string | null) {
    if (!current) return next || null;
    if (!next) return current;
    return next < current ? next : current;
}

function normalizeEntregador(entregador: Entregador): Entregador | null {
    const id = String(entregador.id_entregador || '').trim();
    if (!id) return null;

    return {
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
        primeira_data_aparicao: entregador.primeira_data_aparicao || null,
    };
}

function mergeEntregadoresById(entregadores: Entregador[]) {
    const normalizedRows: Entregador[] = [];
    const seenIds = new Set<string>();
    let hasDuplicates = false;

    for (const entregador of entregadores) {
        const normalized = normalizeEntregador(entregador);
        if (!normalized) continue;

        if (seenIds.has(normalized.id_entregador)) {
            hasDuplicates = true;
        } else {
            seenIds.add(normalized.id_entregador);
        }

        normalizedRows.push(normalized);
    }

    if (!hasDuplicates) {
        return normalizedRows;
    }

    const merged = new Map<string, Entregador>();

    for (const entregador of normalizedRows) {
        const current = merged.get(entregador.id_entregador);
        if (!current) {
            merged.set(entregador.id_entregador, { ...entregador });
            continue;
        }

        current.nome_entregador = chooseDisplayName(current.nome_entregador, entregador.nome_entregador);
        current.corridas_ofertadas += entregador.corridas_ofertadas;
        current.corridas_aceitas += entregador.corridas_aceitas;
        current.corridas_rejeitadas += entregador.corridas_rejeitadas;
        current.corridas_completadas += entregador.corridas_completadas;
        current.total_segundos += entregador.total_segundos;
        current.primeira_data_aparicao = chooseEarliestDate(
            current.primeira_data_aparicao,
            entregador.primeira_data_aparicao
        );

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
    rpcName: 'listar_entregadores_v2',
    filterPayload: FilterPayload,
    options: { fallbackOnError: boolean }
): Promise<{ data: EntregadoresData | null; error: RpcError | null }> {
    const normalizedPayload = expandImplicitSingleYearToDateRange(filterPayload);
    const allowedParams = ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_origem', 'p_data_inicial', 'p_data_final', 'p_organization_id', 'p_only_dedicados', 'p_search'];
    const listarEntregadoresPayload: FilterPayload = {};

    for (const key of allowedParams) {
        if (normalizedPayload && key in normalizedPayload && normalizedPayload[key] !== null && normalizedPayload[key] !== undefined) {
            listarEntregadoresPayload[key] = normalizedPayload[key];
        }
    }

    const result = await fetchDashboardDataApi<any>('entregadores', listarEntregadoresPayload);

    if (result.error) {
        const search = typeof listarEntregadoresPayload.p_search === 'string'
            ? listarEntregadoresPayload.p_search.trim()
            : '';
        const hasSearch = search.length >= 3;
        const selectedWeeks = Array.isArray(filterPayload.p_semanas)
            ? filterPayload.p_semanas.filter(Boolean)
            : [];
        const hasExplicitNarrowPeriod = Boolean(
            filterPayload.p_semana ||
            selectedWeeks.length > 0 ||
            filterPayload.p_data_inicial ||
            filterPayload.p_data_final
        );
        const canUseRawFallback = hasSearch || hasExplicitNarrowPeriod;
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

        if ((is500 || isTimeout) && options.fallbackOnError && canUseRawFallback) {
            try {
                const fallbackData = await fetchEntregadoresFallback(listarEntregadoresPayload);
                if (fallbackData) {
                    return { data: fallbackData, error: null };
                }
            } catch (fallbackError) {
                safeLog.error('Erro no fallback ao buscar entregadores:', fallbackError);
            }
        } else if ((is500 || isTimeout) && options.fallbackOnError) {
            safeLog.warn(
                'Fallback bruto de entregadores ignorado para evitar scan amplo em dados_corridas.',
                { hasSearch, hasExplicitNarrowPeriod }
            );
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
    const allowedParams = ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_data_inicial', 'p_data_final', 'p_organization_id'];
    const payload: FilterPayload = {};

    for (const key of allowedParams) {
        if (key in options.filterPayload && options.filterPayload[key] !== null && options.filterPayload[key] !== undefined) {
            payload[key] = options.filterPayload[key];
        }
    }

    const result = await fetchDedicadoApi<unknown>('entregadores', payload);
    const parsedData = parseEntregadoresResponse(result.data);

    if (result.error) {
        safeLog.error('Erro ao buscar entregadores do DEDICADO via API:', result.error);
        return { data: { entregadores: [], total: 0 }, error: result.error };
    }

    return { data: normalizeDedicadoAderencia(parsedData), error: null };
}
