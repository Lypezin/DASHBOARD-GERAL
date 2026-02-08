import { FilterPayload } from '@/types/filters';

/**
 * Builds a filter payload by extracting allowed parameters from the input payload.
 * Only includes keys that exist in allowedParams and have non-null/undefined values.
 */
export function buildFilterPayload(filterPayload: FilterPayload, allowedParams: string[]): FilterPayload {
    const payload: FilterPayload = {};
    for (const key of allowedParams) {
        if (filterPayload && key in filterPayload && filterPayload[key] !== null && filterPayload[key] !== undefined) {
            payload[key] = filterPayload[key];
        }
    }
    return payload;
}
