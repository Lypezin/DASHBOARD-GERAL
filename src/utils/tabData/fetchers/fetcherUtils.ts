import { FilterPayload } from '@/types/filters';
import { expandImplicitSingleYearToDateRange, applyAllYearsDateRangeToPayload } from '@/utils/filters/allYearsRange';

/**
 * Builds a filter payload by extracting allowed parameters from the input payload.
 * Only includes keys that exist in allowedParams and have non-null/undefined values.
 * Also expands single-year and all-years date ranges where needed.
 */
export function buildFilterPayload(filterPayload: FilterPayload, allowedParams: string[]): FilterPayload {
    const normalizedPayload = applyAllYearsDateRangeToPayload(expandImplicitSingleYearToDateRange(filterPayload));
    const payload: FilterPayload = {};
    for (const key of allowedParams) {
        if (normalizedPayload && key in normalizedPayload && normalizedPayload[key] !== null && normalizedPayload[key] !== undefined) {
            payload[key] = normalizedPayload[key];
        }
    }
    return payload;
}

