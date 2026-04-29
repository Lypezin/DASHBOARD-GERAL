"use client";

import React from 'react';
import { ResultadosFilters } from './resultados/ResultadosFilters';
import { ResultadosCards } from './resultados/ResultadosCards';
import { useResultadosData } from './resultados/useResultadosData';
import { ResultadosErrorState } from './resultados/ResultadosErrorState';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { handleExportExcelResultados } from './resultados/ResultadosExcelExport';
import { BarChart3 } from 'lucide-react';

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
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Análise de Resultados
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Performance e conversão por responsável
            </p>
          </div>
        </div>
        {atendentesData.length > 0 && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {atendentesData.length} responsáveis
          </span>
        )}
      </div>

      {/* Filters */}
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

      {/* Content */}
      <ResultadosCards
        totalEnviado={totais.totalEnviado}
        totalLiberado={totais.totalLiberado}
        atendentesData={atendentesData}
      />
    </div>
  );
});

ResultadosView.displayName = 'ResultadosView';

export default ResultadosView;
