'use client';

import React from 'react';
import { TabNavigation } from '@/components/TabNavigation';
import { useDashboardPage } from '@/hooks/useDashboardPage';
import { DashboardFiltersContainer } from '@/components/dashboard/DashboardFiltersContainer';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import { OnlineUsersSidebar } from '@/components/OnlineUsersSidebar';
import type { AderenciaSemanal } from '@/types';

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<DashboardLoadingState />}>
      <DashboardContent />
    </React.Suspense>
  );
}



function DashboardContent() {
  const { auth, ui, filters, data } = useDashboardPage();

  // Mostrar loading enquanto verifica autenticação
  if (auth.isCheckingAuth) {
    return <DashboardAuthLoading />;
  }

  // Se não estiver autenticado, não renderizar nada (já foi redirecionado)
  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {ui.loading && <DashboardLoadingState />}
        {ui.error && <DashboardErrorState error={ui.error} />}

        {!ui.loading && !ui.error && (
          <div className="space-y-4 animate-fade-in">
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

            <TabNavigation
              activeTab={ui.activeTab}
              onTabChange={ui.handleTabChange}
              variant={ui.activeTab === 'comparacao' || ui.activeTab === 'marketing' ? 'compact' : 'default'}
            />

            <main>
              <DashboardViewsRenderer
                activeTab={ui.activeTab}
                chartReady={ui.chartReady}
                aderenciaGeral={data.dashboard.aderenciaGeral as AderenciaSemanal | undefined}
                aderenciaSemanal={data.dashboard.aderenciaSemanal}
                aderenciaDia={data.dashboard.aderenciaDia}
                aderenciaTurno={data.dashboard.aderenciaTurno}
                aderenciaSubPraca={data.dashboard.aderenciaSubPraca}
                aderenciaOrigem={data.dashboard.aderenciaOrigem}
                totals={data.dashboard.totals || undefined}
                utrData={data.tabs.utrData}
                loadingTabData={data.tabs.loading}
                entregadoresData={data.tabs.entregadoresData}
                valoresData={data.tabs.valoresData}
                prioridadeData={data.tabs.prioridadeData}
                evolucaoMensal={data.evolution.mensal}
                evolucaoSemanal={data.evolution.semanal}
                loadingEvolucao={data.evolution.loading}
                anoSelecionado={filters.state.ano ?? data.evolution.anoSelecionado}
                anosDisponiveis={data.evolution.anosOptions}
                onAnoChange={data.evolution.setAno}
                semanas={filters.options.semanas}
                pracas={filters.options.pracas}
                subPracas={filters.options.subPracas}
                origens={filters.options.origens}
                currentUser={auth.currentUser}
                filters={filters.state}
                aderenciaSemanalV2={data.resumo?.aderenciaSemanalV2}
                loadingResumo={data.resumo?.loading}
              />
            </main>
          </div>
        )}
      </div>
      <OnlineUsersSidebar currentUser={auth.currentUser} currentTab={ui.activeTab} />
    </div>
  );
}