import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ValoresEntregador, Entregador, EntregadoresData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Car,
  BarChart3,
  Search,
  X,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const IS_DEV = process.env.NODE_ENV === 'development';

const ValoresView = React.memo(function ValoresView({
  valoresData,
  loading,
}: {
  valoresData: ValoresEntregador[];
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof ValoresEntregador>('total_taxas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ValoresEntregador[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para formatar valores em Real
  const formatarReal = (valor: number | null | undefined) => {
    if (valor == null || isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  // Pesquisa com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await safeRpc<ValoresEntregador[]>('pesquisar_valores_entregadores', {
          termo_busca: searchTerm.trim()
        }, {
          timeout: 30000,
          validateParams: true
        });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        if (IS_DEV) safeLog.error('Erro ao pesquisar valores:', err);
        // Fallback para pesquisa local
        const valoresArray = Array.isArray(valoresData) ? valoresData : [];
        const filtered = valoresArray.filter(e =>
          e?.nome_entregador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e?.id_entregador?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, valoresData]);

  // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
  const dataToDisplay = useMemo(() => {
    try {
      const valoresArray = Array.isArray(valoresData) ? valoresData : [];

      if (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) {
        return searchResults;
      }

      return valoresArray;
    } catch (err) {
      safeLog.error('Erro ao processar dados de valores:', err);
      setError('Erro ao processar dados. Tente recarregar a página.');
      return [];
    }
  }, [searchTerm, searchResults, valoresData]);

  // Criar uma cópia estável para ordenação
  const sortedValores: ValoresEntregador[] = useMemo(() => {
    if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) return [];

    const dataCopy = [...dataToDisplay];

    return dataCopy.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
        const aStr = String(aValue).toLowerCase().trim();
        const bStr = String(bValue).toLowerCase().trim();
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;

      const comparison = aNum - bNum;

      if (comparison === 0) {
        return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dataToDisplay, sortField, sortDirection]);

  const handleSort = (field: keyof ValoresEntregador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calcular estatísticas gerais
  const dataArray = useMemo(() => {
    return Array.isArray(dataToDisplay) ? dataToDisplay : [];
  }, [dataToDisplay]);

  const totalGeral = useMemo(() => {
    return dataArray.reduce((sum, e) => {
      const valor = Number(e?.total_taxas) || 0;
      return sum + valor;
    }, 0);
  }, [dataArray]);

  const totalCorridas = useMemo(() => {
    return dataArray.reduce((sum, e) => {
      const valor = Number(e?.numero_corridas_aceitas) || 0;
      return sum + valor;
    }, 0);
  }, [dataArray]);

  const taxaMediaGeral = useMemo(() => {
    return totalCorridas > 0 ? totalGeral / totalCorridas : 0;
  }, [totalGeral, totalCorridas]);

  const totalEntregadores = useMemo(() => {
    return Array.isArray(dataArray) ? dataArray.length : 0;
  }, [dataArray]);

  // Função auxiliar para ícone de ordenação
  const SortIcon = ({ field }: { field: keyof ValoresEntregador }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="ml-1 h-3 w-3 text-slate-900 dark:text-white" /> :
      <ArrowDown className="ml-1 h-3 w-3 text-slate-900 dark:text-white" />;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Carregando valores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md mx-auto rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-4" />
          <p className="text-lg font-bold text-rose-900 dark:text-rose-100">Erro ao carregar dados</p>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!valoresData || !Array.isArray(valoresData) || valoresData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <DollarSign className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum valor encontrado</p>
        <p className="text-sm text-slate-500">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de Pesquisa */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar entregador por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-sm rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
              </div>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-xs text-slate-500">
              {isSearching ? 'Pesquisando...' : `Encontrado${totalEntregadores === 1 ? '' : 's'} ${totalEntregadores} resultado${totalEntregadores === 1 ? '' : 's'}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Geral */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {formatarReal(totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todas as taxas
            </p>
          </CardContent>
        </Card>

        {/* Entregadores */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregadores</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totalEntregadores.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de entregadores listados
            </p>
          </CardContent>
        </Card>

        {/* Total Corridas */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Corridas</CardTitle>
            <Car className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totalCorridas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Corridas aceitas no período
            </p>
          </CardContent>
        </Card>

        {/* Taxa Média */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {formatarReal(taxaMediaGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio por corrida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Valores */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Valores por Entregador
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Detalhamento financeiro individual
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-hidden">
            {/* Cabeçalho fixo */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-4 gap-4 px-6 py-3 min-w-[600px]">
                <div
                  className="cursor-pointer text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                  onClick={() => handleSort('nome_entregador')}
                >
                  Entregador
                  <SortIcon field="nome_entregador" />
                </div>
                <div
                  className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                  onClick={() => handleSort('total_taxas')}
                >
                  Total
                  <SortIcon field="total_taxas" />
                </div>
                <div
                  className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                  onClick={() => handleSort('numero_corridas_aceitas')}
                >
                  Corridas
                  <SortIcon field="numero_corridas_aceitas" />
                </div>
                <div
                  className="cursor-pointer text-right text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-end gap-1"
                  onClick={() => handleSort('taxa_media')}
                >
                  Média
                  <SortIcon field="taxa_media" />
                </div>
              </div>
            </div>

            {/* Lista otimizada */}
            <div className="max-h-[500px] sm:max-h-[600px] overflow-x-auto overflow-y-auto">
              {sortedValores.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedValores.map((entregador, index) => {
                    if (!entregador) return null;

                    const ranking = index + 1;
                    const totalTaxas = Number(entregador.total_taxas) || 0;
                    const numeroCorridas = Number(entregador.numero_corridas_aceitas) || 0;
                    const taxaMedia = Number(entregador.taxa_media) || 0;
                    const nomeEntregador = String(entregador.nome_entregador || entregador.id_entregador || 'N/A');

                    return (
                      <div
                        key={`${entregador.id_entregador}-${index}`}
                        className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors min-w-[600px]"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {ranking}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{nomeEntregador}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {formatarReal(totalTaxas)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            {numeroCorridas.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-slate-600 dark:text-slate-400 text-sm">
                            {formatarReal(taxaMedia)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum dado para exibir
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ValoresView.displayName = 'ValoresView';

export default ValoresView;
