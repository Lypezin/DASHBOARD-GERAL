import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseDashboardTab } from './dashboardTabsConfig';

export function useDashboardActiveTab() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  return useMemo(() => parseDashboardTab(tabParam), [tabParam]);
}
