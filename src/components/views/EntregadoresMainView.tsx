'use client';

import React, { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { Users } from 'lucide-react';
import { EntregadoresMainStatsCards } from './entregadores/EntregadoresMainStatsCards';
import { EntregadoresMainSearch } from './entregadores/EntregadoresMainSearch';
import { EntregadoresMainTable } from './entregadores/EntregadoresMainTable';
import { calcularPercentualAceitas, calcularPercentualCompletadas } from './entregadores/EntregadoresUtils';

const EntregadoresMainView = React.memo(function EntregadoresMainView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof Entregador | 'percentual_aceitas' | 'percentual_completadas'>('aderencia_percentual');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar e ordenar entregadores
  const sortedEntregadores: Entregador[] = useMemo(() => {
    if (!entregadoresData?.entregadores) return [];

    let filtered = entregadoresData.entregadores;

    // Aplicar filtro de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.nome_entregador.toLowerCase().includes(term) ||
          e.id_entregador.toLowerCase().includes(term)
      );
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      if (sortField === 'percentual_aceitas') {
        aValue = calcularPercentualAceitas(a);
        bValue = calcularPercentualAceitas(b);
      } else if (sortField === 'percentual_completadas') {
        aValue = calcularPercentualCompletadas(a);
        bValue = calcularPercentualCompletadas(b);
      } else {
        aValue = a[sortField] ?? 0;
        bValue = b[sortField] ?? 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [entregadoresData, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calcular estatísticas antes dos early returns
  const totalEntregadores = sortedEntregadores.length;
  const aderenciaMedia = totalEntregadores > 0
    ? sortedEntregadores.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores
    : 0;
  const rejeicaoMedia = totalEntregadores > 0
    ? sortedEntregadores.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores
    : 0;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData || !entregadoresData.entregadores || entregadoresData.entregadores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Users className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum entregador encontrado</p>
        <p className="text-sm text-slate-500">Tente ajustar os filtros para ver mais resultados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EntregadoresMainStatsCards
        totalEntregadores={totalEntregadores}
        aderenciaMedia={aderenciaMedia}
        rejeicaoMedia={rejeicaoMedia}
        totalCorridas={entregadoresData.total || 0}
      />

      <EntregadoresMainSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <EntregadoresMainTable
        sortedEntregadores={sortedEntregadores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        searchTerm={searchTerm}
      />
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
