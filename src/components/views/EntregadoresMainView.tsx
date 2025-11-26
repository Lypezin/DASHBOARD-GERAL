'use client';

import React, { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

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
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400 inline" />;
    return sortDirection === 'asc' ?
      <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" /> :
      <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white inline" />;
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
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entregadores */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entregadores</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totalEntregadores.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entregadores listados
            </p>
          </CardContent>
        </Card>

        {/* Aderência Média */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aderência Média</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {aderenciaMedia.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(aderenciaMedia, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rejeição Média */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejeição Média</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {rejeicaoMedia.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(rejeicaoMedia, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Corridas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Corridas</CardTitle>
            <Truck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {(entregadoresData.total || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Corridas no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campo de Busca */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou ID do entregador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Entregadores */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Entregadores
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Lista completa de entregadores e suas métricas de performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('nome_entregador')}
                  >
                    Nome {getSortIcon('nome_entregador')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('corridas_ofertadas')}
                  >
                    Ofertadas {getSortIcon('corridas_ofertadas')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('corridas_aceitas')}
                  >
                    Aceitas {getSortIcon('corridas_aceitas')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('percentual_aceitas')}
                  >
                    % Aceitas {getSortIcon('percentual_aceitas')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('corridas_completadas')}
                  >
                    Completadas {getSortIcon('corridas_completadas')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('percentual_completadas')}
                  >
                    % Completadas {getSortIcon('percentual_completadas')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('aderencia_percentual')}
                  >
                    Aderência {getSortIcon('aderencia_percentual')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
                    onClick={() => handleSort('rejeicao_percentual')}
                  >
                    Rejeição {getSortIcon('rejeicao_percentual')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedEntregadores.map((entregador, index) => (
                  <tr
                    key={entregador.id_entregador}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {entregador.nome_entregador}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {entregador.id_entregador}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {entregador.corridas_ofertadas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {entregador.corridas_aceitas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-normal">
                        {calcularPercentualAceitas(entregador).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {entregador.corridas_completadas.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-normal">
                        {calcularPercentualCompletadas(entregador).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`font-medium ${entregador.aderencia_percentual >= 90
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                            : entregador.aderencia_percentual >= 70
                              ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                              : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'
                          }`}
                      >
                        {entregador.aderencia_percentual.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`font-medium ${entregador.rejeicao_percentual <= 10
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
                            : entregador.rejeicao_percentual <= 30
                              ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                              : 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800'
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
            <div className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhum entregador encontrado com o termo &quot;{searchTerm}&quot;
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

EntregadoresMainView.displayName = 'EntregadoresMainView';

export default EntregadoresMainView;
