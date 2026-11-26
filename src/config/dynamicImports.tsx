/**
 * Configuracao centralizada de dynamic imports.
 */

import React from 'react';
import dynamic from 'next/dynamic';
import type { TabType } from '@/types';

function ViewLoadingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando visualização"
      className="mx-auto min-h-[420px] w-full max-w-[1600px] space-y-5 pb-8 pt-2 motion-safe:animate-fade-in"
    >
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/75 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-800/75 dark:bg-slate-950/65">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="dashboard-loading-shimmer h-4 w-48 max-w-full rounded-full" />
          <div className="dashboard-loading-shimmer h-3 w-72 max-w-full rounded-full" />
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          Carregando
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-slate-200/75 bg-white/90 p-5 dark:border-slate-800/75 dark:bg-slate-950/65">
            <div className="dashboard-loading-shimmer h-3 w-24 rounded-full" />
            <div className="dashboard-loading-shimmer h-7 w-28 rounded-lg" />
            <div className="dashboard-loading-shimmer h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200/75 bg-white/90 p-5 dark:border-slate-800/75 dark:bg-slate-950/65">
        <div className="dashboard-loading-shimmer h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

const viewLoading = () => <ViewLoadingIndicator />;

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
  marketing_apresentacao: () => import('@/components/views/marketing/MarketingApresentacaoView').then((mod) => ({ default: mod.default })),
  entrada_saida: () => import('@/components/views/marketing/MarketingEntradaSaidaView').then((mod) => ({ default: mod.default })),
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

export const DashboardView = dynamic(dashboardViewLoaders.dashboard, { ssr: false, loading: viewLoading });
export const MarketingView = dynamic(dashboardViewLoaders.marketing, { ssr: false, loading: viewLoading });
export const AnaliseView = dynamic(dashboardViewLoaders.analise, { ssr: false, loading: viewLoading });
export const UtrView = dynamic(dashboardViewLoaders.utr, { ssr: false, loading: viewLoading });
export const EvolucaoView = dynamic(dashboardViewLoaders.evolucao, { ssr: false, loading: viewLoading });
export const ValoresView = dynamic(dashboardViewLoaders.valores, { ssr: false, loading: viewLoading });
export const EntregadoresMainView = dynamic(dashboardViewLoaders.entregadores, { ssr: false, loading: viewLoading });
export const PrioridadePromoView = dynamic(dashboardViewLoaders.prioridade, { ssr: false, loading: viewLoading });
export const ComparacaoView = dynamic(dashboardViewLoaders.comparacao, { ssr: false, loading: viewLoading });
export const MarketingComparacaoView = dynamic(dashboardViewLoaders.marketing_comparacao, { ssr: false, loading: viewLoading });
export const MarketingApresentacaoView = dynamic(dashboardViewLoaders.marketing_apresentacao, { ssr: false, loading: viewLoading });
export const MarketingEntradaSaidaView = dynamic(dashboardViewLoaders.entrada_saida, { ssr: false, loading: viewLoading });
export const DedicadoView = dynamic(dashboardViewLoaders.dedicado, { ssr: false, loading: viewLoading });
