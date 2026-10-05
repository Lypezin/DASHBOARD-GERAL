'use client';

import React from 'react';
import { EvolucaoFilters } from './evolucao/EvolucaoFilters';
import { EvolucaoChart } from './evolucao/EvolucaoChart';
import { EvolucaoStatsCards } from './evolucao/EvolucaoStatsCards';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useEvolucaoViewController } from './evolucao/hooks/useEvolucaoViewController';
import { useDashboardEvolucao } from '@/hooks/dashboard/useDashboardEvolucao';
import type { FilterPayload } from '@/types/filters';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { RefreshCw } from 'lucide-react';
import { ViewTransition } from '@/components/ui/view-transition';

const EvolucaoView = React.memo(function EvolucaoView({
  filterPayload,
  anoSelecionado,
  onAnoChange,
}: {
  filterPayload: FilterPayload;
  anoSelecionado: number;
  onAnoChange?: (ano: number) => void;
}) {
  const { evolucaoMensal, evolucaoSemanal, hasCurrentData, loading, error, refetch } = useDashboardEvolucao({
    filterPayload,
    anoEvolucao: anoSelecionado
  });

  const { state, actions } = useEvolucaoViewController({
    evolucaoMensal,
    evolucaoSemanal,
    loading,
    anoSelecionado
  });
  const showInitialLoading = loading && !hasCurrentData;
  const showCurrentRequestError = Boolean(error && !hasCurrentData);

  return (
    <ViewContainer className="space-y-8">
      <ViewTransition stateKey={showInitialLoading ? 'evolucao-loading' : showCurrentRequestError ? 'evolucao-error' : `evolucao-content-${state.viewMode}-${anoSelecionado}`} preventExitInteraction>
        {showInitialLoading ? (
          <div className="min-w-0">
            <DashboardSkeleton contentOnly />
          </div>
        ) : showCurrentRequestError ? (
          <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/85 px-4 py-8 text-center text-rose-900 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100 sm:px-8">
            <div>
              <p className="font-semibold">Não foi possível carregar a Evolução.</p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">{error?.message}</p>
            </div>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="mx-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-300/80 bg-white px-4 py-2 font-semibold text-rose-800 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-100 dark:hover:bg-rose-900/60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="min-w-0 space-y-8">
            {state.loading ? (
              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-200">
                Atualizando evolucao com os filtros atuais...
              </div>
            ) : null}

            {error ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/85 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Não foi possível atualizar a Evolução.</p>
                  <p className="mt-0.5 text-rose-700 dark:text-rose-200">{error.message}</p>
                </div>
                <button
                  type="button"
                  onClick={refetch}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300/80 bg-white px-3 py-2 font-semibold text-rose-800 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-100 dark:hover:bg-rose-900/60"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Tentar novamente
                </button>
              </div>
            ) : null}

            <EvolucaoFilters
              viewMode={state.viewMode}
              onViewModeChange={actions.setViewMode}
              selectedMetrics={state.selectedMetrics}
              onMetricsChange={actions.setSelectedMetrics}
            />

            <EvolucaoChart
              chartData={state.chartData}
              chartOptions={state.chartOptions}
              chartError={state.chartError}
              anoSelecionado={anoSelecionado}
              selectedMetrics={state.selectedMetrics}
              viewMode={state.viewMode}
              dadosAtivosLength={state.totalPeriodos}
            />

            <EvolucaoStatsCards
              dadosAtivos={state.dadosAtivos}
              viewMode={state.viewMode}
              anoSelecionado={anoSelecionado}
            />
          </div>
        )}
      </ViewTransition>
    </ViewContainer>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
