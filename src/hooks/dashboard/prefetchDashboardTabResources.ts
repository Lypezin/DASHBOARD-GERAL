import { preloadDashboardView } from '@/config/dynamicImports';
import { ensureChartRegistration } from '@/hooks/dashboard/useChartRegistration';
import type { TabType } from '@/types';

export function prefetchDashboardTabResources(tab: TabType): void {
  preloadDashboardView(tab);
  if (tab === 'evolucao' || tab === 'comparacao') {
    void ensureChartRegistration();
  }
}
