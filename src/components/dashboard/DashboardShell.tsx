'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardFiltersContainer } from '@/components/dashboard/DashboardFiltersContainer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { FilterRefreshIndicator } from '@/components/dashboard/OperationalLoading';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { OnlineUsersSidebarLauncher } from '@/components/OnlineUsersSidebar/OnlineUsersSidebarLauncher';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';
import { useDeferredMount } from '@/hooks/ui/useDeferredMount';
import { calculateAderenciaGeral } from '@/utils/dashboard/aderenciaCalc';
import { getDimensionFilterSupport } from '@/utils/filters/dimensionFilterSupport';
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
  const viewFilterPayload = React.useMemo(() => {
    const support = getDimensionFilterSupport(ui.activeTab);

    return {
      ...filters.payload,
      ...(!support.subPraca ? { p_sub_praca: null, p_sub_pracas: null } : {}),
      ...(!support.origem ? { p_origem: null, p_origens: null } : {}),
      ...(!support.turno ? { p_turno: null, p_turnos: null } : {}),
    };
  }, [filters.payload, ui.activeTab]);
  const isMainDataTab = ui.activeTab === 'dashboard' || ui.activeTab === 'analise';
  const showInitialLoading = isMainDataTab && ui.loading && !hasMainData && !data.hasSuccessfulData;

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
        <div className="space-y-6 motion-safe:animate-fade-in">
          {ui.error && hasMainData ? (
            <div role="alert" className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
              Nao foi possivel atualizar os indicadores agora. Mantendo a ultima resposta valida na tela.
            </div>
          ) : null}
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
                optionsLoading={filters.optionsLoading}
                optionsError={filters.optionsError}
              />
              {ui.activeTab !== 'marketing' && filters.optionsLoading && !filters.optionsError ? (
                <p role="status" className="mt-2 pl-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Carregando opções dos filtros…
                </p>
              ) : null}
              {ui.activeTab !== 'marketing' && filters.optionsError ? (
                <div role="alert" className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
                  <span>{filters.optionsError}</span>
                  <button type="button" onClick={filters.retryOptions} className="underline underline-offset-2 hover:no-underline">
                    Tentar novamente
                  </button>
                </div>
              ) : null}
            </div>
            {showLoginBadge ? <DeferredLoginStreakBadge className="self-start xl:self-auto shrink-0" /> : null}
          </div>

          {ui.error && !hasMainData ? <DashboardErrorState error={ui.error} /> : null}

          {isMainDataTab && ui.loading && !showInitialLoading ? (
            <FilterRefreshIndicator
              isLoading={ui.loading}
              viewName={ui.activeTab === 'analise' ? 'a análise' : 'a visão geral'}
            />
          ) : null}

          {!ui.error || hasMainData ? (
            <main className="min-w-0">
              <DashboardViewsRenderer
                activeTab={ui.activeTab}
                chartReady={ui.chartReady}
                currentUser={auth.currentUser}
                filters={filters.state}
                setFilters={filters.setState}
                filterPayload={viewFilterPayload}
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
                mainDataLoading={data.loading}
                mainDataError={data.error}
                retryMainData={data.retryMainData}
              />
            </main>
          ) : null}
        </div>
      </div>

      <OnlineUsersSidebarLauncher currentUser={auth.currentUser} currentTab={ui.activeTab} />
    </div>
  );
}
