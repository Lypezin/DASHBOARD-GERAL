import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { isMissingRpcFunctionError } from '@/lib/rpc/errors';
import { CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';
import { toUniqueOptions, createPracasKey, createDimensionCacheKey } from './dimensionHelpers';
import { DimensionCacheEntry, isValidCacheEntry, readCachedOptions, writeCachedOptions } from './dimensionCache';
import { IS_DEV } from '@/constants/environment';

interface DimensionOptionsRpcRow {
    sub_pracas?: unknown[];
    origens?: unknown[];
    turnos?: unknown[];
}

type RemoteOptionsState = {
    scopeKey: string;
    options: DimensionCacheEntry;
};

type RemoteStatusState = {
    scopeKey: string;
    loading: boolean;
    error: string | null;
};

const EMPTY_OPTIONS = { subPracas: [], origens: [], turnos: [] };

export function useDimensionOptions(
    dimensoes: DimensoesDashboard | null,
    currentUser?: CurrentUser | null,
    filters?: Filters | null,
    organizationId?: string | null
) {
    const [remoteOptionsState, setRemoteOptionsState] = useState<RemoteOptionsState | null>(null);
    const [remoteStatusState, setRemoteStatusState] = useState<RemoteStatusState | null>(null);
    const [retryIndex, setRetryIndex] = useState(0);
    const retry = useCallback(() => setRetryIndex((value) => value + 1), []);
    const stableTargetPracasRef = useRef<{ key: string; pracas: string[] } | null>(null);
    const assignedPracasKey = currentUser?.assigned_pracas.join('|') || '';
    const assignedPracas = useMemo(() => assignedPracasKey.split('|').filter(Boolean), [assignedPracasKey]);
    const userHasFullAccess = hasFullCityAccess(currentUser);
    const targetPracas = useMemo(() => {
        if (filters?.praca) {
            if (userHasFullAccess || assignedPracas.some((praca) => praca.toUpperCase() === filters.praca?.toUpperCase())) {
                return [filters.praca];
            }
        }

        if (!userHasFullAccess && assignedPracas.length > 0) return assignedPracas;
        return [];
    }, [assignedPracas, filters?.praca, userHasFullAccess]);

    const targetPracasKey = useMemo(() => createPracasKey(targetPracas), [targetPracas]);
    if (!stableTargetPracasRef.current || stableTargetPracasRef.current.key !== targetPracasKey) {
        stableTargetPracasRef.current = { key: targetPracasKey, pracas: [...targetPracas] };
    }
    const stableTargetPracas = stableTargetPracasRef.current.pracas;
    const dimensionCacheKey = useMemo(
        () => createDimensionCacheKey(targetPracasKey, organizationId || currentUser?.organization_id),
        [currentUser?.organization_id, organizationId, targetPracasKey]
    );

    // The dimensions returned with dashboard rows are narrowed by the active
    // filters. Use the independent RPC for filter choices so selecting one
    // value does not remove the other available choices. An empty plaza list
    // means all plazas within this user's organization.
    const baseOptions = dimensoes ? null : EMPTY_OPTIONS;
    const shouldFetchRemote = Boolean(dimensoes);

    useEffect(() => {
        let cancelled = false;

        if (!shouldFetchRemote) {
            setRemoteStatusState({ scopeKey: dimensionCacheKey, loading: false, error: null });
            return () => {
                cancelled = true;
            };
        }

        const cached = readCachedOptions(dimensionCacheKey, true);
        if (cached) {
            setRemoteOptionsState({ scopeKey: dimensionCacheKey, options: cached });
            if (isValidCacheEntry(cached)) {
                setRemoteStatusState({ scopeKey: dimensionCacheKey, loading: false, error: null });
                return () => {
                    cancelled = true;
                };
            }
        }

        setRemoteStatusState({ scopeKey: dimensionCacheKey, loading: true, error: null });

        const fetchOptionsByPraca = async () => {
            try {
                const rpcParams = {
                    p_pracas: stableTargetPracas,
                    p_organization_id: organizationId || currentUser?.organization_id || null,
                };
                const combinedResult = await safeRpc<DimensionOptionsRpcRow[]>(
                    'get_dashboard_dimension_options',
                    rpcParams,
                    { timeout: 10000, validateParams: false }
                );

                if (cancelled) return;

                let resultData: DimensionOptionsRpcRow;
                if (!combinedResult.error) {
                    const row = Array.isArray(combinedResult.data) ? combinedResult.data[0] : null;
                    if (!row || !Array.isArray(row.sub_pracas) || !Array.isArray(row.origens) || !Array.isArray(row.turnos)) {
                        throw new Error('A consulta de dimensões retornou uma resposta inválida.');
                    }
                    resultData = row;
                } else {
                    if (!isMissingRpcFunctionError(combinedResult.error)) {
                        throw new Error('Falha ao consultar dimensões para a praça selecionada.');
                    }

                    const [subPracasResult, origensResult, turnosResult] = await Promise.all([
                        safeRpc<string[]>('get_subpracas_by_praca', { p_pracas: stableTargetPracas }, { timeout: 10000, validateParams: false }),
                        safeRpc<string[]>('get_origens_by_praca', { p_pracas: stableTargetPracas }, { timeout: 10000, validateParams: false }),
                        safeRpc<string[]>('get_turnos_by_praca', { p_pracas: stableTargetPracas }, { timeout: 10000, validateParams: false }),
                    ]);

                    if (cancelled) return;
                    if (subPracasResult.error || origensResult.error || turnosResult.error) {
                        throw new Error('Falha ao consultar dimensões para a praça selecionada.');
                    }
                    if (!Array.isArray(subPracasResult.data) || !Array.isArray(origensResult.data) || !Array.isArray(turnosResult.data)) {
                        throw new Error('As consultas de dimensões retornaram respostas inválidas.');
                    }

                    resultData = {
                        sub_pracas: subPracasResult.data,
                        origens: origensResult.data,
                        turnos: turnosResult.data,
                    };
                }

                const nextOptions: DimensionCacheEntry = {
                    timestamp: Date.now(),
                    subPracas: toUniqueOptions(resultData.sub_pracas),
                    origens: toUniqueOptions(resultData.origens),
                    turnos: toUniqueOptions(resultData.turnos),
                };

                setRemoteOptionsState({ scopeKey: dimensionCacheKey, options: nextOptions });
                setRemoteStatusState({ scopeKey: dimensionCacheKey, loading: false, error: null });
                writeCachedOptions(dimensionCacheKey, nextOptions);
            } catch (error) {
                if (IS_DEV) safeLog.warn('Falha ao carregar as opções de dimensão da praça.', error);
                if (!cancelled) {
                    setRemoteStatusState({
                        scopeKey: dimensionCacheKey,
                        loading: false,
                        error: 'Não foi possível atualizar os filtros de subpraça, origem e turno.',
                    });
                }
            }
        };

        void fetchOptionsByPraca();

        return () => {
            cancelled = true;
        };
    }, [currentUser?.organization_id, dimensionCacheKey, dimensoes, organizationId, retryIndex, shouldFetchRemote, stableTargetPracas]);

    const activeRemoteOptions = remoteOptionsState?.scopeKey === dimensionCacheKey
        ? remoteOptionsState.options
        : null;
    const activeStatus = remoteStatusState?.scopeKey === dimensionCacheKey ? remoteStatusState : null;
    const optionsLoading = shouldFetchRemote && (!activeStatus || activeStatus.loading);
    const optionsError = activeStatus?.error || null;
    const options = baseOptions || activeRemoteOptions || EMPTY_OPTIONS;

    return {
        ...options,
        loading: optionsLoading,
        error: optionsError,
        retry,
    };
}
