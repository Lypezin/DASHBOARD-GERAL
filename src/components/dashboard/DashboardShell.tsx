'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardFiltersContainer } from '@/components/dashboard/DashboardFiltersContainer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { OnlineUsersSidebarLauncher } from '@/components/OnlineUsersSidebar/OnlineUsersSidebarLauncher';
import { LoadingNotice } from '@/components/ui/loading-notice';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';
import { FaviconManager } from '@/components/layout/FaviconManager';

const DeferredActivityTracker = dynamic(
  () => import('@/components/dashboard/ActivityTracker').then((mod) => ({ default: mod.ActivityTracker })),
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
  const showActivityTracker = useDeferredMount({
    enabled: auth.isAuthenticated,
    timeoutMs: 700,
  });
  const showLoginBadge = useDeferredMount({
    enabled: auth.isAuthenticated,
    timeoutMs: 1200,
  });

  const aderenciaGeral = React.useMemo(() => {
    if (!data.aderenciaSemanal) return undefined;
    return calculateAderenciaGeral(data.aderenciaSemanal);
  }, [data.aderenciaSemanal]);

  const percentualAderencia = aderenciaGeral?.aderencia_percentual || 0;
  const hasMainData = Boolean(data.totals)
    || data.aderenciaSemanal.length > 0
    || data.aderenciaDia.length > 0
    || data.aderenciaTurno.length > 0
    || data.aderenciaSubPraca.length > 0
    || data.aderenciaOrigem.length > 0
    || data.aderenciaDiaOrigem.length > 0;
  const showInitialLoading = ui.loading && !hasMainData;

  if (auth.isCheckingAuth) return <DashboardAuthLoading />;
  if (auth.hasSessionWithoutProfile) {
    return (
      <DashboardErrorState
        error={auth.error || 'Não foi possível carregar seu perfil. Tente atualizar a sessão.'}
      />
    );
  }
  if (auth.hasMissingOrganization) {
    return (
      <DashboardErrorState
        error={auth.error || 'Seu usuário está aprovado, mas ainda não possui uma organização vinculada.'}
      />
    );
  }
  if (!auth.isAuthenticated) return null;

  return (
    <div className="relative min-h-screen">
      <FaviconManager percentual={percentualAderencia} />

      {showActivityTracker ? (
        <DeferredActivityTracker
          activeTab={ui.activeTab}
          filters={filters.state}
          currentUser={auth.currentUser}
        />
      ) : null}

      <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        {showInitialLoading && <DashboardLoadingState />}
        {ui.error && <DashboardErrorState error={ui.error} />}

        {!showInitialLoading && !ui.error && (
          <div className="space-y-6 motion-safe:animate-fade-in">
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
              {showLoginBadge ? <DeferredLoginStreakBadge className="self-start xl:self-auto shrink-0" /> : null}
            </div>

            {ui.loading ? (
              <LoadingNotice
                tone="blue"
                message="Atualizando indicadores com os filtros atuais"
                detail="Mantendo o painel visivel enquanto os dados novos chegam."
              />
            ) : null}

            <main className="min-w-0">
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
