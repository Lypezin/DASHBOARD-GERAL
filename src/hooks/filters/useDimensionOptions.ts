import { useEffect, useMemo, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';
import { toUniqueOptions, createPracasKey, createDimensionCacheKey, processFallbackSubPracas } from './dimensionHelpers';
import { DimensionCacheEntry, readCachedOptions, writeCachedOptions } from './dimensionCache';

const IS_DEV = process.env.NODE_ENV === 'development';

interface DimensionOptionsRpcRow {
    sub_pracas?: unknown[];
    origens?: unknown[];
    turnos?: unknown[];
}

export function useDimensionOptions(
    dimensoes: DimensoesDashboard | null,
    currentUser?: CurrentUser | null,
    filters?: Filters | null,
    organizationId?: string | null
) {
    const [remoteOptions, setRemoteOptions] = useState<DimensionCacheEntry | null>(null);
    const assignedPracasKey = currentUser?.assigned_pracas.join('|') || '';
    const assignedPracas = useMemo(() => assignedPracasKey.split('|').filter(Boolean), [assignedPracasKey]);
    const userHasFullAccess = hasFullCityAccess(currentUser);
    const hasScopedDimensions = useMemo(() => {
        if (!dimensoes) return false;

        return (
            dimensoes.sub_pracas.length > 0 ||
            dimensoes.origens.length > 0 ||
            (dimensoes.turnos?.length || 0) > 0
        );
    }, [dimensoes]);

    const targetPracas = useMemo(() => {
        if (filters?.praca) return [filters.praca];

        if (!userHasFullAccess && assignedPracas.length > 0) {
            return assignedPracas;
        }

        return [];
    }, [filters?.praca, userHasFullAccess, assignedPracas]);

    const targetPracasKey = useMemo(() => createPracasKey(targetPracas), [targetPracas]);
    const dimensionCacheKey = useMemo(
        () => createDimensionCacheKey(targetPracasKey, organizationId || currentUser?.organization_id),
        [currentUser?.organization_id, organizationId, targetPracasKey]
    );

    const baseOptions = useMemo(() => {
        if (!dimensoes) {
            return { subPracas: [], origens: [], turnos: [] };
        }

        if (targetPracas.length === 0 || hasScopedDimensions || !userHasFullAccess) {
            return {
                subPracas: toUniqueOptions(dimensoes.sub_pracas),
                origens: toUniqueOptions(dimensoes.origens),
                turnos: toUniqueOptions(dimensoes.turnos || [])
            };
        }

        return null;
    }, [dimensoes, hasScopedDimensions, targetPracas.length, userHasFullAccess]);

    useEffect(() => {
        if (!dimensoes || targetPracas.length === 0 || hasScopedDimensions || !userHasFullAccess) {
            setRemoteOptions(null);
            return;
        }

        let cancelled = false;

        const fetchOptionsByPraca = async () => {
            const cached = readCachedOptions(dimensionCacheKey);
            if (cached) {
                setRemoteOptions(cached);
                return;
            }

            try {
                const rpcParams = {
                    p_pracas: targetPracas,
                    p_organization_id: organizationId || currentUser?.organization_id || null
                };
                const combinedResult = await safeRpc<DimensionOptionsRpcRow[]>(
                    'get_dashboard_dimension_options',
                    rpcParams,
                    { timeout: 10000, validateParams: false }
                );

                if (cancelled) return;
                if (!combinedResult.error && Array.isArray(combinedResult.data)) {
                    const row = combinedResult.data[0] || {};
                    const nextOptions: DimensionCacheEntry = {
                        timestamp: Date.now(),
                        subPracas: toUniqueOptions(row.sub_pracas),
                        origens: toUniqueOptions(row.origens),
                        turnos: toUniqueOptions(row.turnos)
                    };

                    setRemoteOptions(nextOptions);
                    writeCachedOptions(dimensionCacheKey, nextOptions);
                    return;
                }

                const [subPracasResult, origensResult, turnosResult] = await Promise.all([
                    safeRpc<string[]>('get_subpracas_by_praca', { p_pracas: targetPracas }, { timeout: 10000, validateParams: false }),
                    safeRpc<string[]>('get_origens_by_praca', { p_pracas: targetPracas }, { timeout: 10000, validateParams: false }),
                    safeRpc<string[]>('get_turnos_by_praca', { p_pracas: targetPracas }, { timeout: 10000, validateParams: false })
                ]);

                if (cancelled) return;
                if (subPracasResult.error || origensResult.error || turnosResult.error) {
                    throw new Error('Falha ao carregar dimensoes por praca');
                }

                const nextOptions: DimensionCacheEntry = {
                    timestamp: Date.now(),
                    subPracas: toUniqueOptions(subPracasResult.data),
                    origens: toUniqueOptions(origensResult.data),
                    turnos: toUniqueOptions(turnosResult.data)
                };

                setRemoteOptions(nextOptions);
                writeCachedOptions(dimensionCacheKey, nextOptions);
            } catch (error) {
                if (IS_DEV) safeLog.warn('Failed to fetch dimension options by praca', error);
                if (!cancelled) {
                    const fallbackOptions = {
                        timestamp: Date.now(),
                        subPracas: processFallbackSubPracas(dimensoes, targetPracas),
                        origens: [],
                        turnos: []
                    };
                    setRemoteOptions(fallbackOptions);
                    writeCachedOptions(dimensionCacheKey, fallbackOptions);
                }
            }
        };

        void fetchOptionsByPraca();

        return () => {
            cancelled = true;
        };
    }, [currentUser?.organization_id, dimensionCacheKey, dimensoes, hasScopedDimensions, organizationId, targetPracas, userHasFullAccess]);

    if (baseOptions) {
        return baseOptions;
    }

    return remoteOptions || { subPracas: [], origens: [], turnos: [] };
}
