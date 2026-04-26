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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      {showActivityTracker ? (
        <DeferredActivityTracker
          activeTab={ui.activeTab}
          filters={filters.state}
          currentUser={auth.currentUser}
        />
      ) : null}

      <div className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {ui.loading && <DashboardLoadingState />}
        {ui.error && <DashboardErrorState error={ui.error} />}

        {!ui.loading && !ui.error && (
          <div className="space-y-4 animate-fade-in">
            {ui.activeTab === 'dashboard' && showDashboardWidgets ? <DeferredCityLastUpdatesTicker /> : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
              {showLoginBadge ? <DeferredLoginStreakBadge className="self-start lg:self-auto" /> : null}
            </div>

            <TabNavigation
              activeTab={ui.activeTab}
              onTabChange={ui.handleTabChange}
              variant={ui.activeTab === 'comparacao' || ui.activeTab === 'marketing' ? 'compact' : 'default'}
            />

            <main>
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
