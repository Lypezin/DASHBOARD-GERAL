'use client';

import React from 'react';
import { ResultadosFilters } from './resultados/ResultadosFilters';
import { ResultadosCards } from './resultados/ResultadosCards';
import { useResultadosData } from './resultados/useResultadosData';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { motion, Variants } from 'framer-motion';

const ResultadosView = React.memo(function ResultadosView() {
  const {
    loading,
    error,
    atendentesData,
    totais,
    filters,
    handleFilterChange
  } = useResultadosData();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={8} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
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

