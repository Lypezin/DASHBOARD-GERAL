
'use client';

import React from 'react';
import { useEntregadoresViewController } from './entregadores/useEntregadoresViewController';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { EntregadoresErrorState } from './entregadores/components/EntregadoresStates';
import { EntregadoresLayout } from './entregadores/EntregadoresLayout';
import { motion, Variants } from 'framer-motion';

interface EntregadoresViewProps {
  // Este componente é usado apenas no Marketing, não recebe props
}

const EntregadoresView = React.memo(function EntregadoresView({
}: EntregadoresViewProps = {}) {
  const { state, actions, utils } = useEntregadoresViewController();

  if (state.loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TableSkeleton rows={10} columns={7} />
      </div>
    );
  }

  if (state.error) {
    return (
      <EntregadoresErrorState
        error={state.error}
        onRetry={() => {
          actions.setError(null);
          actions.setLoading(true);
          actions.fetchEntregadoresFn();
        }}
      />
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
      className="space-y-6 animate-fade-in pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 shadow-sm" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Base de Entregadores
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Gestão e monitoramento da frota ativa
            </p>
          </div>
        </div>
        <EntregadoresLayout
          // Data
          entregadores={state.entregadores}
          entregadoresFiltrados={state.entregadoresFiltrados}
          totais={state.totais}
          searchTerm={state.searchTerm}
          cidadeSelecionada={state.cidadeSelecionada}
          filtroRodouDia={state.filtroRodouDia}
          filtroDataInicio={state.filtroDataInicio}
          sortField={state.sortField}
          sortDirection={state.sortDirection}

          // Actions
          onSearchChange={actions.setSearchTerm}
          onCidadeChange={actions.setCidadeSelecionada}
          onFiltroRodouDiaChange={actions.setFiltroRodouDia}
          onFiltroDataInicioChange={actions.setFiltroDataInicio}
          onSort={actions.handleSort}
          onExport={actions.exportarParaExcel}

          // Utils
          formatarSegundosParaHoras={utils.formatarSegundosParaHoras}
        />
      </motion.div>
    </motion.div>
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
