import { useEffect, useMemo, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';
const CACHE_DURATION = 1000 * 60 * 30;
const dimensionMemoryCache = new Map<string, DimensionCacheEntry>();

interface DimensionCacheEntry {
    timestamp: number;
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
}

function toUniqueOptions(arr: unknown): FilterOption[] {
    if (!Array.isArray(arr)) return [];

    const values = arr
        .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>;
                return record.value || record.label || record.nome || record.name || Object.values(record)[0];
            }
            return item;
        })
        .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
        .map(String)
        .filter(Boolean);

    return Array.from(new Set(values))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((value) => ({ value, label: value }));
}

function createPracasKey(pracas: string[]) {
    return pracas.map((praca) => praca.trim().toUpperCase()).filter(Boolean).sort().join('|');
}

function processFallbackSubPracas(dimensoes: DimensoesDashboard, activePracas: string[]) {
    return toUniqueOptions(dimensoes.sub_pracas).filter((subPraca) =>
        activePracas.some((praca) => {
            const upperSubPraca = subPraca.value.toUpperCase();
            const upperPraca = praca.toUpperCase();
            return upperSubPraca.includes(upperPraca) || upperSubPraca.startsWith(upperPraca);
        })
    );
}

function isValidCacheEntry(entry?: DimensionCacheEntry | null): entry is DimensionCacheEntry {
    return !!entry && Date.now() - entry.timestamp < CACHE_DURATION;
}

function getStorageKey(key: string) {
    return `dashboard_dimension_options_v1_${key}`;
}

function readCachedOptions(key: string): DimensionCacheEntry | null {
    const memoryEntry = dimensionMemoryCache.get(key);
    if (isValidCacheEntry(memoryEntry)) return memoryEntry;

    try {
        const raw = sessionStorage.getItem(getStorageKey(key));
        if (!raw) return null;

        const entry = JSON.parse(raw) as DimensionCacheEntry;
        if (isValidCacheEntry(entry)) {
            dimensionMemoryCache.set(key, entry);
            return entry;
        }
    } catch {
        sessionStorage.removeItem(getStorageKey(key));
    }

    return null;
}

function writeCachedOptions(key: string, entry: DimensionCacheEntry) {
    dimensionMemoryCache.set(key, entry);

    try {
        sessionStorage.setItem(getStorageKey(key), JSON.stringify(entry));
    } catch {
        // Cache local e opcional.
    }
}

export function useDimensionOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null, filters?: Filters | null) {
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
            const cached = readCachedOptions(targetPracasKey);
            if (cached) {
                setRemoteOptions(cached);
                return;
            }

            try {
                const rpcParams = { p_pracas: targetPracas };
                const [subPracasResult, origensResult, turnosResult] = await Promise.all([
                    safeRpc<string[]>('get_subpracas_by_praca', rpcParams, { timeout: 10000, validateParams: false }),
                    safeRpc<string[]>('get_origens_by_praca', rpcParams, { timeout: 10000, validateParams: false }),
                    safeRpc<string[]>('get_turnos_by_praca', rpcParams, { timeout: 10000, validateParams: false })
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
                writeCachedOptions(targetPracasKey, nextOptions);
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
                    writeCachedOptions(targetPracasKey, fallbackOptions);
                }
            }
        };

        void fetchOptionsByPraca();

        return () => {
            cancelled = true;
        };
    }, [dimensoes, hasScopedDimensions, targetPracas, targetPracasKey, userHasFullAccess]);

    if (baseOptions) {
        return baseOptions;
    }

    return remoteOptions || { subPracas: [], origens: [], turnos: [] };
}
