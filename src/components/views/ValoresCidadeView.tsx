'use client';

import React from 'react';
import { useValoresCidadeAuth } from '@/hooks/valoresCidade/useValoresCidadeAuth';
import { useValoresCidadeData } from '@/hooks/valoresCidade/useValoresCidadeData';
import { useValoresCidadeFilters } from '@/hooks/valoresCidade/useValoresCidadeFilters';
import { ValoresCidadeAuth } from './valoresCidade/ValoresCidadeAuth';
import { ValoresCidadeFilters } from './valoresCidade/ValoresCidadeFilters';
import { ValoresCidadeCards } from './valoresCidade/ValoresCidadeCards';
import { ValoresCidadeHeader } from './valoresCidade/ValoresCidadeHeader';
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
      <ViewTransition stateKey={authLoading ? 'valores-cidade-auth-loading' : 'valores-cidade-auth'}>
        <ValoresCidadeAuth loading={authLoading} errorMessage={errorMessage} />
      </ViewTransition>
    );
  }

  const hasCityData = cidadesData.length > 0;

  if ((loading || error) && !hasCityData) {
    return (
      <ViewTransition stateKey={loading ? 'valores-cidade-loading' : 'valores-cidade-error'}>
        <ValoresCidadeFeedback loading={loading} error={error} />
      </ViewTransition>
    );
  }

  return (
    <ViewTransition stateKey="valores-cidade-content">
      <div className="space-y-6 motion-safe:animate-fade-in pb-8">
        {loading ? (
          <LoadingNotice
            tone="emerald"
            message="Atualizando valores por cidade"
            detail="Mantendo os ultimos cards visiveis enquanto os filtros sao aplicados."
          />
        ) : null}
        {error ? (
          <div role="alert" className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
            Nao foi possivel atualizar os valores agora. Exibindo a ultima resposta valida.
          </div>
        ) : null}
        <div className="space-y-4">
          <ValoresCidadeHeader />
          <ValoresCidadeFilters
            filter={filter}
            filterEnviados={filterEnviados}
            onFilterChange={handleFilterChange}
            onFilterEnviadosChange={handleFilterEnviadosChange}
          />
        </div>

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
