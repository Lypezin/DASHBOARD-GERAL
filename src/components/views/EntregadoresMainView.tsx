'use client';

import React, { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import MetricCard from '../MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total de Entregadores"
          value={totalEntregadores}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Aderência Média"
          value={aderenciaMedia}
          icon="✅"
          percentage={aderenciaMedia}
          color="green"
        />
        <MetricCard
          title="Rejeição Média"
          value={rejeicaoMedia}
          icon="❌"
          percentage={rejeicaoMedia}
          color="red"
        />
        <MetricCard
          title="Total de Corridas"
          value={entregadoresData.total || 0}
          icon="🚚"
          color="blue"
        />
      </div>

      {/* Campo de Busca */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
          
          <CardContent className="relative p-6">
            <input
              type="text"
              placeholder="Pesquisar por nome ou ID do entregador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Entregadores */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                  Entregadores
                </CardTitle>
                <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">
                  Lista completa de entregadores e suas métricas de performance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <div className="overflow-x-auto">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg overflow-hidden">
                <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700 border-b-2 border-blue-200 dark:border-slate-600">
                  <th
                    className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                    onClick={() => handleSort('nome_entregador')}
                  >
                    Nome {getSortIcon('nome_entregador')}
                  </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => handleSort('corridas_ofertadas')}
                >
                  Ofertadas {getSortIcon('corridas_ofertadas')}
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => handleSort('corridas_aceitas')}
                >
                  Aceitas {getSortIcon('corridas_aceitas')}
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => handleSort('percentual_aceitas')}
                >
                  % Aceitas {getSortIcon('percentual_aceitas')}
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => handleSort('corridas_completadas')}
                >
                  Completadas {getSortIcon('corridas_completadas')}
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => handleSort('percentual_completadas')}
                >
                  % Completadas {getSortIcon('percentual_completadas')}
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
                  onClick={() => handleSort('aderencia_percentual')}
                >
                  Aderência {getSortIcon('aderencia_percentual')}
                </th>
                <th
                  className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors"
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
                  className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {entregador.nome_entregador}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {entregador.id_entregador}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                    {entregador.corridas_ofertadas.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {entregador.corridas_aceitas.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {calcularPercentualAceitas(entregador).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-700 dark:text-blue-400">
                    {entregador.corridas_completadas.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {calcularPercentualCompletadas(entregador).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge
                      className={`text-xs font-semibold ${
                        entregador.aderencia_percentual >= 90
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : entregador.aderencia_percentual >= 70
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {entregador.aderencia_percentual.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge
                      className={`text-xs font-semibold ${
                        entregador.rejeicao_percentual <= 10
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : entregador.rejeicao_percentual <= 30
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {entregador.rejeicao_percentual.toFixed(1)}%
                    </Badge>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;

