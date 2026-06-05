/**
 * Configuracao centralizada de dynamic imports.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import type { TabType } from '@/types';

const defaultLoading = (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
  </div>
);

const marketingLoading = (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
  </div>
);

const dashboardViewLoaders = {
  dashboard: () => import('@/components/views/DashboardView').then((mod) => ({ default: mod.default })),
  marketing: () => import('@/components/views/MarketingView').then((mod) => ({ default: mod.default })),
  analise: () => import('@/components/views/AnaliseView').then((mod) => ({ default: mod.default })),
  utr: () => import('@/components/views/UtrView').then((mod) => ({ default: mod.default })),
  evolucao: () => import('@/components/views/EvolucaoView').then((mod) => ({ default: mod.default })),
  valores: () => import('@/components/views/ValoresView').then((mod) => ({ default: mod.default })),
  entregadores: () => import('@/components/views/EntregadoresMainView').then((mod) => ({ default: mod.default })),
  prioridade: () => import('@/components/views/PrioridadePromoView').then((mod) => ({ default: mod.default })),
  comparacao: () => import('@/components/views/ComparacaoView').then((mod) => ({ default: mod.default })),
  marketing_comparacao: () => import('@/components/views/marketing/MarketingComparacaoView').then((mod) => ({ default: mod.default })),
  dedicado: () => import('@/components/views/DedicadoView').then((mod) => ({ default: mod.default })),
} satisfies Partial<Record<TabType, () => Promise<{ default: React.ComponentType<any> }>>>;

const preloadedDashboardViews = new Set<string>();

export function preloadDashboardView(tab: TabType | string) {
  const loader = dashboardViewLoaders[tab as keyof typeof dashboardViewLoaders];
  if (!loader || preloadedDashboardViews.has(tab)) return;

  preloadedDashboardViews.add(tab);
  void loader().catch(() => {
    preloadedDashboardViews.delete(tab);
  });
}

export function preloadDashboardViews(tabs: readonly (TabType | string)[]) {
  tabs.forEach(preloadDashboardView);
}

export const DashboardView = dynamic(dashboardViewLoaders.dashboard, { ssr: false, loading: () => defaultLoading });
export const MarketingView = dynamic(dashboardViewLoaders.marketing, { ssr: false, loading: () => marketingLoading });
export const AnaliseView = dynamic(dashboardViewLoaders.analise, { ssr: false, loading: () => defaultLoading });
export const UtrView = dynamic(dashboardViewLoaders.utr, { ssr: false, loading: () => defaultLoading });
export const EvolucaoView = dynamic(dashboardViewLoaders.evolucao, { ssr: false, loading: () => defaultLoading });
export const ValoresView = dynamic(dashboardViewLoaders.valores, { ssr: false, loading: () => defaultLoading });
export const EntregadoresMainView = dynamic(dashboardViewLoaders.entregadores, { ssr: false, loading: () => defaultLoading });
export const PrioridadePromoView = dynamic(dashboardViewLoaders.prioridade, { ssr: false, loading: () => defaultLoading });
export const ComparacaoView = dynamic(dashboardViewLoaders.comparacao, { ssr: false, loading: () => defaultLoading });
export const MarketingComparacaoView = dynamic(dashboardViewLoaders.marketing_comparacao, { ssr: false, loading: () => defaultLoading });
export const DedicadoView = dynamic(dashboardViewLoaders.dedicado, { ssr: false, loading: () => defaultLoading });
