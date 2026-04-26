"use client";

import React from 'react';
import { ResultadosFilters } from './resultados/ResultadosFilters';
import { ResultadosCards } from './resultados/ResultadosCards';
import { useResultadosData } from './resultados/useResultadosData';
import { ResultadosErrorState } from './resultados/ResultadosErrorState';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { handleExportExcelResultados } from './resultados/ResultadosExcelExport';

const ResultadosView = React.memo(function ResultadosView() {
  const {
    loading,
    error,
    atendentesData,
    totais,
    filters,
    handleFilterChange
  } = useResultadosData();

  const handleExport = React.useCallback(() => {
    handleExportExcelResultados(atendentesData, new Date().toISOString().split('T')[0]);
  }, [atendentesData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={8} columns={4} />
      </div>
    );
  }

  if (error) {
    return <ResultadosErrorState error={error} />;
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-1.5 rounded-full bg-blue-600 shadow-sm" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Analise de Resultados
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Performance de atendentes e conversao de envios
            </p>
          </div>
        </div>
        <ResultadosFilters
          filtroLiberacao={filters.filtroLiberacao}
          filtroEnviados={filters.filtroEnviados}
          filtroEnviadosLiberados={filters.filtroEnviadosLiberados}
          onFiltroLiberacaoChange={(filter) => handleFilterChange('filtroLiberacao', filter)}
          onFiltroEnviadosChange={(filter) => handleFilterChange('filtroEnviados', filter)}
          onFiltroEnviadosLiberadosChange={(filter) => handleFilterChange('filtroEnviadosLiberados', filter)}
          onExport={handleExport}
          hasData={atendentesData && atendentesData.length > 0}
        />
      </div>

      <div className="space-y-4">
        <ResultadosCards
          totalEnviado={totais.totalEnviado}
          totalLiberado={totais.totalLiberado}
          atendentesData={atendentesData}
        />
      </div>
    </div>
  );
});

ResultadosView.displayName = 'ResultadosView';

export default ResultadosView;
