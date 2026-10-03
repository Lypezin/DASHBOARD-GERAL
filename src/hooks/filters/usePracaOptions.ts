import { useMemo } from 'react';
import { FilterOption, CurrentUser, hasFullCityAccess, DimensoesDashboard, Filters } from '@/types';

function normalizePracas(values: unknown[]): string[] {
    return Array.from(new Set(
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
    )).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function usePracaOptions(
    dimensoes: DimensoesDashboard | null,
    currentUser?: CurrentUser | null,
    _filters?: Filters | null
): FilterOption[] {
    const assignedPracasKey = currentUser?.assigned_pracas?.join('|') || '';
    const assignedPracas = useMemo(() => assignedPracasKey.split('|').filter(Boolean), [assignedPracasKey]);
    const userHasFullAccess = hasFullCityAccess(currentUser);
    const basePracas = useMemo(
        () => normalizePracas((dimensoes?.pracas || []).map(String)),
        [dimensoes?.pracas]
    );

    return useMemo(() => {
        if (!currentUser) {
            return basePracas.map((value) => ({ value, label: value }));
        }

        if (!userHasFullAccess) {
            const restrictedPracas = basePracas.length > 0
                ? basePracas.filter((praca) => assignedPracas.some((allowed) => allowed.toUpperCase() === praca.toUpperCase()))
                : assignedPracas;
            return normalizePracas(restrictedPracas).map((value) => ({ value, label: value }));
        }

        return basePracas.map((value) => ({ value, label: value }));
    }, [assignedPracas, basePracas, currentUser, userHasFullAccess]);
}
