
'use client';

import React from 'react';
import { useEntregadoresViewController } from './entregadores/useEntregadoresViewController';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { EntregadoresErrorState } from './entregadores/components/EntregadoresStates';
import { EntregadoresLayout } from './entregadores/EntregadoresLayout';

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

  return (
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
  );
});

EntregadoresView.displayName = 'EntregadoresView';

export default EntregadoresView;
