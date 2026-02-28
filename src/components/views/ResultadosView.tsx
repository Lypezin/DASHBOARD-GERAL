"use client";

import React from 'react';
import { ResultadosFilters } from './resultados/ResultadosFilters';
import { ResultadosCards } from './resultados/ResultadosCards';
import { useResultadosData } from './resultados/useResultadosData';
import { ResultadosErrorState } from './resultados/ResultadosErrorState';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { motion, Variants } from 'framer-motion';
import { exportarResultadosParaExcel } from './resultados/ResultadosExcelExport';

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
    exportarResultadosParaExcel(atendentesData);
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

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
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
      </motion.div>

      {/* Header com Totais */}
      <motion.div className="space-y-4" variants={item}>
        <ResultadosCards
          totalEnviado={totais.totalEnviado}
          totalLiberado={totais.totalLiberado}
          atendentesData={atendentesData}
        />
      </motion.div>
    </motion.div>
  );
});

ResultadosView.displayName = 'ResultadosView';

export default ResultadosView;

