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
  const viewStateKey = showInitialLoading
    ? 'evolucao-loading'
    : showCurrentRequestError
      ? 'evolucao-error'
      : 'evolucao-content';
  const chartStateKey = `evolucao-chart-${state.viewMode}-${anoSelecionado}`;

  return (
    <ViewContainer className="space-y-5 pb-10 pt-4">
      <header className="rounded-xl border border-[#164d70] bg-[#174d70] px-4 py-4 shadow-[0_8px_28px_-22px_rgba(12,54,81,0.6)] sm:px-6 sm:py-5">
        <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[24px]">Evolução</h1>
        <p className="mt-1.5 text-[12px] leading-5 text-sky-100/90 sm:text-[13px]">
          Acompanhe a variação de pedidos e horas ao longo do período.
        </p>
      </header>

      <ViewTransition stateKey={viewStateKey} preventExitInteraction>
        {showInitialLoading ? (
          <div className="min-w-0">
            <DashboardSkeleton contentOnly />
          </div>
        ) : showCurrentRequestError ? (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100 sm:px-8">
            <div>
              <p className="font-semibold">Não foi possível carregar a Evolução.</p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">{error?.message}</p>
            </div>
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              className="mx-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-800 transition-colors duration-150 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-100 dark:hover:bg-rose-900/60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="min-w-0 space-y-5">
            {state.loading ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
                Atualizando a evolução com os filtros atuais...
              </div>
            ) : null}

            {error ? (
              <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Não foi possível atualizar a Evolução.</p>
                  <p className="mt-0.5 text-rose-700 dark:text-rose-200">{error.message}</p>
                </div>
                <button
                  type="button"
                  onClick={refetch}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 font-semibold text-rose-800 transition-colors duration-150 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-100 dark:hover:bg-rose-900/60"
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

            <ViewTransition stateKey={chartStateKey} preventExitInteraction>
              <div className="min-w-0 space-y-5">
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
            </ViewTransition>
          </div>
        )}
      </ViewTransition>
    </ViewContainer>
  );
});

EvolucaoView.displayName = 'EvolucaoView';

export default EvolucaoView;
