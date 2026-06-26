import { preloadDashboardView } from '@/config/dynamicImports';
import { prefetchTabDataInBackground } from '@/hooks/data/useTabData';
import type { TabType } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { getLatestDashboardFilterPayload } from './dashboardPrefetchState';

const DATA_PREFETCH_TABS = new Set<TabType>(['entregadores', 'valores']);

function getPrefetchPayload(tab: TabType, payload: FilterPayload): FilterPayload {
  return tab === 'valores' ? { ...payload, detailed: false } : payload;
}

export function prefetchDashboardTabResources(tab: TabType): void {
  preloadDashboardView(tab);

  if (!DATA_PREFETCH_TABS.has(tab)) return;

  const latestPayload = getLatestDashboardFilterPayload();
  if (!latestPayload) return;

  void prefetchTabDataInBackground(tab, getPrefetchPayload(tab, latestPayload));
}

export function prefetchDashboardTabData(tab: TabType, payload: FilterPayload): Promise<void> {
  if (!DATA_PREFETCH_TABS.has(tab)) return Promise.resolve();
  return prefetchTabDataInBackground(tab, getPrefetchPayload(tab, payload));
}
