import { useEffect, useMemo, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos
const dimensionMemoryCache = new Map<string, DimensionCacheEntry>();

interface DimensionCacheEntry {
    timestamp: number;
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
}

export function useDimensionOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null, filters?: Filters | null) {
    const [subPracas, setSubPracas] = useState<FilterOption[]>([]);
    const [origens, setOrigens] = useState<FilterOption[]>([]);
    const [turnos, setTurnos] = useState<FilterOption[]>([]);
    const assignedPracasKey = currentUser?.assigned_pracas.join('|') || '';
    const assignedPracas = useMemo(() => assignedPracasKey.split('|').filter(Boolean), [assignedPracasKey]);
    const userHasFullAccess = hasFullCityAccess(currentUser);

    const targetPracas = useMemo(() => {
        if (filters?.praca) return [filters.praca];

        if (!userHasFullAccess && assignedPracas.length) {
            return assignedPracas;
        }

        return [];
    }, [filters?.praca, userHasFullAccess, assignedPracas]);

    const targetPracasKey = useMemo(() => createPracasKey(targetPracas), [targetPracas]);

    useEffect(() => {
        if (!dimensoes) {
            setSubPracas([]);
            setOrigens([]);
            setTurnos([]);
            return;
        }

        if (targetPracas.length === 0) {
            // Para usuarios com acesso total, evita carregar todas as dimensoes da MV.
            // As opcoes detalhadas aparecem assim que uma praca for escolhida.
            setSubPracas(mapToOptions(dimensoes.sub_pracas));
            setTurnos(mapToOptions(dimensoes.turnos || []));
            setOrigens(mapToOptions(dimensoes.origens));
            return;
        }

        let cancelled = false;

        const fetchOptionsByPraca = async () => {
            const cached = readCachedOptions(targetPracasKey);
            if (cached) {
                setSubPracas(cached.subPracas);
                setTurnos(cached.turnos);
                setOrigens(cached.origens);
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

                const nextOptions: DimensionCacheEntry = {
                    timestamp: Date.now(),
                    subPracas: toUniqueOptions(subPracasResult.data),
                    origens: toUniqueOptions(origensResult.data),
                    turnos: toUniqueOptions(turnosResult.data)
                };

                if (subPracasResult.error || origensResult.error || turnosResult.error) {
                    throw new Error('Falha ao carregar dimensoes por praca');
                }

                setSubPracas(nextOptions.subPracas);
                setTurnos(nextOptions.turnos);
                setOrigens(nextOptions.origens);
                writeCachedOptions(targetPracasKey, nextOptions);
                return;
            } catch (e) {
                if (IS_DEV) safeLog.warn('Failed to fetch dimension options by praca', e);
            }

            if (!cancelled) {
                setSubPracas(processFallbackSubPracas(dimensoes, targetPracas));
                setTurnos([]);
                setOrigens([]);
            }
        };

        void fetchOptionsByPraca();

        return () => {
            cancelled = true;
        };
    }, [dimensoes, targetPracas, targetPracasKey]);

    return { subPracas, origens, turnos };
}

function mapToOptions(arr: unknown[]) {
    return Array.isArray(arr) ? toUniqueOptions(arr) : [];
}

function toUniqueOptions(arr: unknown): FilterOption[] {
    if (!Array.isArray(arr)) return [];

    const values = arr
        .map(item => {
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
        .map(value => ({ value, label: value }));
}

function processFallbackSubPracas(dimensoes: DimensoesDashboard, activePracas: string[]) {
    return mapToOptions(dimensoes.sub_pracas).filter(sp => activePracas.some(praca => sp.value.toUpperCase().includes(praca.toUpperCase()) || sp.value.toUpperCase().startsWith(praca.toUpperCase())));
}

function createPracasKey(pracas: string[]) {
    return pracas.map(praca => praca.trim().toUpperCase()).filter(Boolean).sort().join('|');
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
        // Cache local e opcional; se o navegador bloquear, seguimos com cache em memoria.
    }
}

function isValidCacheEntry(entry?: DimensionCacheEntry | null): entry is DimensionCacheEntry {
    return !!entry && Date.now() - entry.timestamp < CACHE_DURATION;
}

function getStorageKey(key: string) {
    return `dashboard_dimension_options_v1_${key}`;
}
