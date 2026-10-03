import { FilterOption } from '@/types';

export function toUniqueOptions(arr: unknown): FilterOption[] {
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

export function createPracasKey(pracas: string[]) {
    return pracas.map((praca) => praca.trim().toUpperCase()).filter(Boolean).sort().join('|');
}

export function createDimensionCacheKey(
    pracasKey: string,
    organizationId?: string | null,
    accessScopeKey = 'default'
) {
    return `${organizationId || 'no-org'}::${accessScopeKey}::${pracasKey}`;
}
