import { preloadDashboardView } from '@/config/dynamicImports';
import type { TabType } from '@/types';

export function prefetchDashboardTabResources(tab: TabType): void {
  preloadDashboardView(tab);
}
