import { useEffect, useMemo, useState } from 'react';
import { safeRpc } from '@/lib/rpcWrapper';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';
import { RPC_TIMEOUTS } from '@/constants/config';

function toOptions(values: string[]) {
    return values.map((value) => ({ value, label: value }));
}

function normalizePracas(values: unknown[]): string[] {
    return Array.from(
        new Set(
            values
                .map((item) => {
                    if (typeof item === 'string') return item;
                    if (item && typeof item === 'object') {
                        const record = item as Record<string, unknown>;
                        return record.praca || record.value || record.label || Object.values(record)[0];
                    }
                    return null;
                })
                .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
                .map((value) => value.trim())
        )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function usePracaOptions(dimensoes: DimensoesDashboard | null, currentUser?: CurrentUser | null, _filters?: Filters | null) {
    const [fallbackPracas, setFallbackPracas] = useState<string[]>([]);

    const assignedPracasKey = currentUser?.assigned_pracas?.join('|') || '';
    const assignedPracas = useMemo(() => assignedPracasKey.split('|').filter(Boolean), [assignedPracasKey]);
    const userHasFullAccess = hasFullCityAccess(currentUser);
    const dimensoesPracasKey = Array.isArray(dimensoes?.pracas) ? dimensoes.pracas.map(String).join('|') : '';

    useEffect(() => {
        let cancelled = false;

        const shouldFetchFallback = userHasFullAccess && dimensoesPracasKey.length === 0;

        if (!shouldFetchFallback) {
            setFallbackPracas([]);
            return;
        }

        const fetchFallbackPracas = async () => {
            try {
                const { data, error } = await safeRpc<any[]>('list_pracas_disponiveis', {}, {
                    timeout: RPC_TIMEOUTS.FAST,
                    validateParams: false
                });

                if (cancelled || error) return;

                setFallbackPracas(normalizePracas(Array.isArray(data) ? data : []));
            } catch {
                if (!cancelled) setFallbackPracas([]);
            }
        };

        void fetchFallbackPracas();

        return () => {
            cancelled = true;
        };
    }, [userHasFullAccess, dimensoesPracasKey]);

    return useMemo(() => {
        const basePracas = dimensoesPracasKey.length > 0
            ? normalizePracas((dimensoes?.pracas || []).map(String))
            : fallbackPracas;

        if (!currentUser) {
            return toOptions(basePracas);
        }

        if (!userHasFullAccess) {
            const restrictedPracas = basePracas.length > 0
                ? basePracas.filter((praca) => assignedPracas.some((allowed) => allowed.toUpperCase() === praca.toUpperCase()))
                : assignedPracas;

            return toOptions(normalizePracas(restrictedPracas));
        }

        return toOptions(basePracas);
    }, [assignedPracas, currentUser, dimensoes?.pracas, dimensoesPracasKey, fallbackPracas, userHasFullAccess]);
}
