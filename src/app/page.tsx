'use client';

import React from 'react';
import { TabNavigation } from '@/components/TabNavigation';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';
import { DashboardFiltersContainer } from '@/components/dashboard/DashboardFiltersContainer';
import { DashboardViewsRenderer } from '@/components/dashboard/DashboardViewsRenderer';
import { DashboardLoadingState } from '@/components/dashboard/DashboardLoadingState';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
import { DashboardAuthLoading } from '@/components/dashboard/DashboardAuthLoading';
import { OnlineUsersSidebar } from '@/components/OnlineUsersSidebar';
import { CityLastUpdatesTicker } from '@/components/dashboard/CityLastUpdatesTicker';

// ... existing imports

            <CityLastUpdatesTicker />
            
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
                utrSemanal={data.evolution.utrSemanal}
                anoSelecionado={filters.state.ano ?? data.evolution.anoSelecionado}
                anosDisponiveis={data.evolution.anosOptions}
                onAnoChange={data.evolution.setAno}
                semanas={filters.options.semanas}
                pracas={filters.options.pracas}
                subPracas={filters.options.subPracas}
                origens={filters.options.origens}
                currentUser={auth.currentUser}
                filters={filters.state}
                setFilters={filters.setState}
              />
            </main>
          </div >
        )}
      </div >
  <OnlineUsersSidebar currentUser={auth.currentUser} currentTab={ui.activeTab} />
    </div >
  );
}