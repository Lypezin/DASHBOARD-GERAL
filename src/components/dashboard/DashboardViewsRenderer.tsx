/**
 * Componente para renderizar as views do dashboard baseado na tab ativa
 * Extraído de src/app/page.tsx
 */

import React, { Suspense, useState, useEffect } from 'react';
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
import { LoadingSpinner } from '@/components/ui/loading';
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
    <LoadingSpinner size="lg" text="Carregando..." />
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTab, setPreviousTab] = useState(activeTab);

  useEffect(() => {
    if (previousTab !== activeTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPreviousTab(activeTab);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, previousTab]);

  // Verificar se precisa esperar Chart.js
  const needsChart = activeTab === 'dashboard' || activeTab === 'analise' || activeTab === 'evolucao' || activeTab === 'comparacao';

  if (needsChart && !chartReady) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando gráficos..." />
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dados..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="animate-in fade-in-0 duration-500">
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

          {activeTab === 'analise' && (
            totals ? (
              <AnaliseView
                totals={totals}
                aderenciaDia={aderenciaDia}
                aderenciaTurno={aderenciaTurno}
                aderenciaSubPraca={aderenciaSubPraca}
                aderenciaOrigem={aderenciaOrigem}
              />
            ) : (
              <LoadingFallback />
            )
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
            <ComparacaoView />
          )}

          {activeTab === 'marketing' && (
            <MarketingView />
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
});

DashboardViewsRenderer.displayName = 'DashboardViewsRenderer';
