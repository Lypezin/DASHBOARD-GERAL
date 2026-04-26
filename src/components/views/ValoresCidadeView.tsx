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

const ValoresCidadeView = React.memo(function ValoresCidadeView() {
  const { isAuthenticated, errorMessage, loading: authLoading } = useValoresCidadeAuth();
  const { filter, filterEnviados, handleFilterChange, handleFilterEnviadosChange } = useValoresCidadeFilters();

  const { loading, error, cidadesData, totalGeral, custoPorLiberado } = useValoresCidadeData(
    isAuthenticated,
    filter,
    filterEnviados
  );

  if (!isAuthenticated) {
    return <ValoresCidadeAuth loading={authLoading} errorMessage={errorMessage} />;
  }

  if (loading || error) {
    return <ValoresCidadeFeedback loading={loading} error={error} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
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
  );
});

ValoresCidadeView.displayName = 'ValoresCidadeView';

export default ValoresCidadeView;
