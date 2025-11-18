'use client';

import React, { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import MetricCard from '../MetricCard';

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

  // Funções para calcular percentuais
  const calcularPercentualAceitas = (entregador: Entregador): number => {
    const ofertadas = entregador.corridas_ofertadas || 0;
    if (ofertadas === 0) return 0;
    return (entregador.corridas_aceitas / ofertadas) * 100;
  };

  const calcularPercentualCompletadas = (entregador: Entregador): number => {
    const aceitas = entregador.corridas_aceitas || 0;
    if (aceitas === 0) return 0;
    return (entregador.corridas_completadas / aceitas) * 100;
  };

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

  const getSortIcon = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-pulse-soft">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData || !entregadoresData.entregadores || entregadoresData.entregadores.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-fade-in">
        <div className="max-w-sm mx-auto rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="text-4xl">📋</div>
          <p className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">Nenhum entregador encontrado</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Tente ajustar os filtros para ver mais resultados.</p>
        </div>
      </div>
    );
  }

  const totalEntregadores = sortedEntregadores.length;
  const aderenciaMedia = totalEntregadores > 0
    ? sortedEntregadores.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores
    : 0;
  const rejeicaoMedia = totalEntregadores > 0
    ? sortedEntregadores.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Entregadores"
          value={totalEntregadores}
          icon="👥"
        />
        <MetricCard
          title="Aderência Média"
          value={aderenciaMedia}
          icon="✅"
          percentage={aderenciaMedia}
        />
        <MetricCard
          title="Rejeição Média"
          value={rejeicaoMedia}
          icon="❌"
          percentage={rejeicaoMedia}
        />
        <MetricCard
          title="Total de Corridas"
          value={entregadoresData.total || 0}
          icon="🚚"
        />
      </div>

      {/* Campo de Busca */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="text"
          placeholder="Pesquisar por nome ou ID do entregador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
        />
      </div>

      {/* Tabela de Entregadores */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('nome_entregador')}
                >
                  Nome {getSortIcon('nome_entregador')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('corridas_ofertadas')}
                >
                  Ofertadas {getSortIcon('corridas_ofertadas')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('corridas_aceitas')}
                >
                  Aceitas {getSortIcon('corridas_aceitas')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('percentual_aceitas')}
                >
                  % Aceitas {getSortIcon('percentual_aceitas')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('corridas_completadas')}
                >
                  Completadas {getSortIcon('corridas_completadas')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('percentual_completadas')}
                >
                  % Completadas {getSortIcon('percentual_completadas')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('aderencia_percentual')}
                >
                  Aderência {getSortIcon('aderencia_percentual')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort('rejeicao_percentual')}
                >
                  Rejeição {getSortIcon('rejeicao_percentual')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedEntregadores.map((entregador, index) => (
                <tr
                  key={entregador.id_entregador}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {entregador.nome_entregador}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {entregador.id_entregador}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {entregador.corridas_ofertadas.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {entregador.corridas_aceitas.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {calcularPercentualAceitas(entregador).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {entregador.corridas_completadas.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {calcularPercentualCompletadas(entregador).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        entregador.aderencia_percentual >= 80
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : entregador.aderencia_percentual >= 60
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {entregador.aderencia_percentual.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        entregador.rejeicao_percentual <= 20
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : entregador.rejeicao_percentual <= 40
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {entregador.rejeicao_percentual.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedEntregadores.length === 0 && searchTerm && (
          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum entregador encontrado com o termo &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;

