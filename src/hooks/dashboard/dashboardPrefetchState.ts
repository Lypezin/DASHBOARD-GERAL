import type { FilterPayload } from '@/types/filters';

let latestDashboardFilterPayload: FilterPayload | null = null;

export function setLatestDashboardFilterPayload(payload: FilterPayload | null) {
  latestDashboardFilterPayload = payload ? { ...payload } : null;
}

export function getLatestDashboardFilterPayload(): FilterPayload | null {
  return latestDashboardFilterPayload ? { ...latestDashboardFilterPayload } : null;
}
