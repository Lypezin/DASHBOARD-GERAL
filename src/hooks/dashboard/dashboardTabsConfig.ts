import type { TabType } from '@/types';

export const DEFAULT_DASHBOARD_TAB: TabType = 'dashboard';

export const VALID_DASHBOARD_TABS: readonly TabType[] = [
  'dashboard',
  'analise',
  'utr',
  'entregadores',
  'valores',
  'evolucao',
  'prioridade',
  'comparacao',
  'marketing',
  'marketing_comparacao',
  'dedicado',
] as const;

export function parseDashboardTab(value: string | null): TabType {
  return value && VALID_DASHBOARD_TABS.includes(value as TabType)
    ? value as TabType
    : DEFAULT_DASHBOARD_TAB;
}
