/**
 * Componente para renderizar as views do dashboard baseado na tab ativa
 * Extraído de src/app/page.tsx
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  DashboardView,
  MarketingView,
  AnaliseView,
  UtrView,
  EvolucaoView,
  ValoresView,
  EntregadoresMainView,
  PrioridadePromoView,
  ComparacaoView,
} from '@/config/dynamicImports';
import type {
  Totals,
  AderenciaSemanal,
  AderenciaDia,
  AderenciaTurno,
  AderenciaSubPraca,
  AderenciaOrigem,
  FilterOption,
  CurrentUser,
  TabType,
} from '@/types';

interface DashboardViewsRendererProps {
  activeTab: TabType;
  chartReady: boolean;
  // Dashboard props
  aderenciaGeral?: AderenciaSemanal;
  aderenciaDia: AderenciaDia[];
  aderenciaTurno: AderenciaTurno[];
  aderenciaSubPraca: AderenciaSubPraca[];
  aderenciaOrigem: AderenciaOrigem[];
  // Analise props
  totals?: Totals;
  // UTR props
  utrData: any;
  loadingTabData: boolean;
  // Entregadores props
  entregadoresData: any;
  // Valores props
  valoresData: any;
  // Prioridade props
  prioridadeData: any;
  // Evolução props
  evolucaoMensal: any;
  evolucaoSemanal: any;
  loadingEvolucao: boolean;
  anoSelecionado: number;
  anosDisponiveis: number[];
  onAnoChange: (ano: number) => void;
  // Comparação props
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: CurrentUser | null;
}

const LoadingFallback = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      <p className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-300">Carregando...</p>
    </div>
  </div>
);

export const DashboardViewsRenderer = React.memo(function DashboardViewsRenderer({
  activeTab,
  chartReady,
  aderenciaGeral,
  aderenciaDia,
  aderenciaTurno,
  aderenciaSubPraca,
  aderenciaOrigem,
  totals,
  utrData,
  loadingTabData,
  entregadoresData,
  valoresData,
  prioridadeData,
  evolucaoMensal,
  evolucaoSemanal,
  loadingEvolucao,
  anoSelecionado,
  anosDisponiveis,
  onAnoChange,
  semanas,
  pracas,
  subPracas,
  origens,
  currentUser,
}: DashboardViewsRendererProps) {
  // Verificar se precisa esperar Chart.js
  const needsChart = activeTab === 'dashboard' || activeTab === 'analise' || activeTab === 'evolucao' || activeTab === 'comparacao';
  
  if (needsChart && !chartReady) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-300">Carregando gráficos...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {activeTab === 'dashboard' && (
          <DashboardView
            aderenciaGeral={aderenciaGeral as AderenciaSemanal | undefined}
            aderenciaDia={aderenciaDia}
            aderenciaTurno={aderenciaTurno}
            aderenciaSubPraca={aderenciaSubPraca}
            aderenciaOrigem={aderenciaOrigem}
          />
        )}
        
        {activeTab === 'analise' && totals && (
          <AnaliseView
            totals={totals}
            aderenciaDia={aderenciaDia}
            aderenciaTurno={aderenciaTurno}
            aderenciaSubPraca={aderenciaSubPraca}
            aderenciaOrigem={aderenciaOrigem}
          />
        )}
        
        {activeTab === 'utr' && (
          <UtrView
            utrData={utrData}
            loading={loadingTabData}
          />
        )}

        {activeTab === 'entregadores' && (
          <EntregadoresMainView
            entregadoresData={entregadoresData}
            loading={loadingTabData}
          />
        )}

        {activeTab === 'valores' && (
          <ValoresView
            valoresData={valoresData}
            loading={loadingTabData}
          />
        )}

        {activeTab === 'prioridade' && (
          <PrioridadePromoView
            entregadoresData={prioridadeData}
            loading={loadingTabData}
          />
        )}

        {activeTab === 'evolucao' && (
          <EvolucaoView
            evolucaoMensal={evolucaoMensal}
            evolucaoSemanal={evolucaoSemanal}
            loading={loadingEvolucao}
            anoSelecionado={anoSelecionado}
            anosDisponiveis={anosDisponiveis}
            onAnoChange={onAnoChange}
          />
        )}
        
        {activeTab === 'comparacao' && (
          <ComparacaoView
            semanas={semanas}
            pracas={pracas}
            subPracas={subPracas}
            origens={origens}
            currentUser={currentUser}
          />
        )}
        
        {activeTab === 'marketing' && (
          <MarketingView />
        )}
      </Suspense>
    </ErrorBoundary>
  );
});

DashboardViewsRenderer.displayName = 'DashboardViewsRenderer';

