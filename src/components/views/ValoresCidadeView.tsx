'use client';

import React from 'react';
import { useValoresCidadeAuth } from '@/hooks/valoresCidade/useValoresCidadeAuth';
import { useValoresCidadeData } from '@/hooks/valoresCidade/useValoresCidadeData';
import { useValoresCidadeFilters } from '@/hooks/valoresCidade/useValoresCidadeFilters';
import { ValoresCidadeAuth } from './valoresCidade/ValoresCidadeAuth';
import { ValoresCidadeFilters } from './valoresCidade/ValoresCidadeFilters';
import { ValoresCidadeCards } from './valoresCidade/ValoresCidadeCards';
import { ValoresCidadeFeedback } from './valoresCidade/ValoresCidadeFeedback';
import { ViewTransition } from '@/components/ui/view-transition';
import { LoadingNotice } from '@/components/ui/loading-notice';

const ValoresCidadeView = React.memo(function ValoresCidadeView() {
  const { isAuthenticated, errorMessage, loading: authLoading } = useValoresCidadeAuth();
  const { filter, filterEnviados, handleFilterChange, handleFilterEnviadosChange } = useValoresCidadeFilters();

  const { loading, error, cidadesData, totalGeral, custoPorLiberado } = useValoresCidadeData(
    isAuthenticated,
    filter,
    filterEnviados
  );

  if (!isAuthenticated) {
    return (
      <ViewTransition stateKey={authLoading ? 'valores-cidade-auth-loading' : 'valores-cidade-auth'} preventExitInteraction>
        <ValoresCidadeAuth loading={authLoading} errorMessage={errorMessage} />
      </ViewTransition>
    );
  }

  const hasCityData = cidadesData.length > 0;

  if ((loading || error) && !hasCityData) {
    return (
      <ViewTransition stateKey={loading ? 'valores-cidade-loading' : 'valores-cidade-error'} preventExitInteraction>
        <ValoresCidadeFeedback loading={loading} error={error} />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey="valores-cidade-content" preventExitInteraction>
      <div className="space-y-6 pb-8">
        {loading ? (
          <LoadingNotice
            tone="blue"
            message="Atualizando valores por cidade"
            detail="Mantendo os últimos valores visíveis enquanto os filtros são aplicados."
          />
        ) : null}
        {error ? (
          <div role="alert" className="rounded-xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
            Não foi possível atualizar os valores agora. Exibindo os dados da última atualização válida.
          </div>
        ) : null}
        <section aria-labelledby="valores-cidade-filters-title" className="space-y-3">
          <div className="flex flex-col gap-1 px-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <h2 id="valores-cidade-filters-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
              Período de análise
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Defina os intervalos para calcular os indicadores</span>
          </div>
          <ValoresCidadeFilters
            filter={filter}
            filterEnviados={filterEnviados}
            onFilterChange={handleFilterChange}
            onFilterEnviadosChange={handleFilterEnviadosChange}
          />
        </section>

        <ValoresCidadeCards
          totalGeral={totalGeral}
          custoPorLiberado={custoPorLiberado}
          cidadesData={cidadesData}
        />
      </div>
    </ViewTransition>
  );
});

ValoresCidadeView.displayName = 'ValoresCidadeView';

export default ValoresCidadeView;
