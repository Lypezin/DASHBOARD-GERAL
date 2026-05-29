'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardFiltersContainer } from '@/components/dashboard/DashboardFiltersContainer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { OnlineUsersSidebarLauncher } from '@/components/OnlineUsersSidebar/OnlineUsersSidebarLauncher';
import { TabNavigation } from '@/components/TabNavigation';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';

const DeferredActivityTracker = dynamic(
  () => import('@/components/dashboard/ActivityTracker').then((mod) => ({ default: mod.ActivityTracker })),
  { ssr: false }
);

const DeferredCityLastUpdatesTicker = dynamic(
  () => import('@/components/dashboard/CityLastUpdatesTicker').then((mod) => ({ default: mod.CityLastUpdatesTicker })),
  { ssr: false }
);

const DeferredLoginStreakBadge = dynamic(
  () => import('@/components/shared/LoginStreakBadge').then((mod) => ({ default: mod.LoginStreakBadge })),
  { ssr: false }
);

export function DashboardShell() {
  return (
    <React.Suspense fallback={<DashboardLoadingState />}>
      <DashboardShellContent />
    </React.Suspense>
  );
}

function DashboardShellContent() {
  const { auth, ui, filters, anoEvolucao, data } = useDashboardPage();
  const showDashboardWidgets = useDeferredMount({
    enabled: auth.isAuthenticated && ui.activeTab === 'dashboard',
    timeoutMs: 900,
  });
  const showActivityTracker = useDeferredMount({
    enabled: auth.isAuthenticated,
    timeoutMs: 700,
  });
  const showLoginBadge = useDeferredMount({
    enabled: auth.isAuthenticated,
    timeoutMs: 1200,
  });

  if (auth.isCheckingAuth) return <DashboardAuthLoading />;
  if (!auth.isAuthenticated) return null;

  return (
    <div className="relative min-h-screen isolate overflow-x-clip bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_34rem),linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f4f8ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34rem),linear-gradient(180deg,#020617_0%,#0f172a_46%,#061329_100%)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_78%_12%,rgba(14,165,233,0.12),transparent_24rem)] dark:bg-[radial-gradient(circle_at_78%_12%,rgba(14,165,233,0.16),transparent_24rem)]" />
      <div className="pointer-events-none fixed bottom-[-10rem] right-[-8rem] -z-10 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl dark:bg-blue-900/15" />
      {showActivityTracker ? (
        <DeferredActivityTracker
          activeTab={ui.activeTab}
          filters={filters.state}
          currentUser={auth.currentUser}
        />
      ) : null}

      <div className="relative z-10 mx-auto max-w-[1880px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        {ui.loading && <DashboardLoadingState />}
        {ui.error && <DashboardErrorState error={ui.error} />}

        {!ui.loading && !ui.error && (
          <div className="space-y-4 animate-fade-in sm:space-y-5">
            {ui.activeTab === 'dashboard' && showDashboardWidgets ? <DeferredCityLastUpdatesTicker /> : null}

            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <DashboardFiltersContainer
                  filters={filters.state}
                  setFilters={filters.setState}
                  anosDisponiveis={filters.options.anos}
                  semanasDisponiveis={filters.options.semanas}
                  pracas={filters.options.pracas}
                  subPracas={filters.options.subPracas}
                  origens={filters.options.origens}
                  turnos={filters.options.turnos}
                  currentUser={auth.currentUser}
                  activeTab={ui.activeTab}
                />
              </div>
              {showLoginBadge ? <DeferredLoginStreakBadge className="self-start xl:self-auto" /> : null}
            </div>

            <TabNavigation
              activeTab={ui.activeTab}
              onTabChange={ui.handleTabChange}
              variant={ui.activeTab === 'comparacao' || ui.activeTab === 'marketing' ? 'compact' : 'default'}
            />

            <main className="min-w-0 overflow-x-clip">
              <DashboardViewsRenderer
                activeTab={ui.activeTab}
                chartReady={ui.chartReady}
                currentUser={auth.currentUser}
                filters={filters.state}
                setFilters={filters.setState}
                filterPayload={filters.payload}
                anoEvolucao={anoEvolucao.valor}
                onAnoChange={anoEvolucao.set}
                semanas={filters.options.semanas}
                pracas={filters.options.pracas}
                subPracas={filters.options.subPracas}
                origens={filters.options.origens}
                totals={data.totals}
                aderenciaSemanal={data.aderenciaSemanal}
                aderenciaDia={data.aderenciaDia}
                aderenciaTurno={data.aderenciaTurno}
                aderenciaSubPraca={data.aderenciaSubPraca}
                aderenciaOrigem={data.aderenciaOrigem}
                aderenciaDiaOrigem={data.aderenciaDiaOrigem}
              />
            </main>
          </div>
        )}
      </div>

      <OnlineUsersSidebarLauncher currentUser={auth.currentUser} currentTab={ui.activeTab} />
    </div>
  );
}
