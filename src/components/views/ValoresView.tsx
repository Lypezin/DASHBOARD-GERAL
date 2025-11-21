import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ValoresEntregador, Entregador, EntregadoresData } from '@/types';
import MetricCard from '../MetricCard';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  // IMPORTANTE: Aceita null/undefined e retorna valor padrão
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
  // Usar useMemo para evitar recriação desnecessária
  // IMPORTANTE: Garantir que sempre seja um array para evitar erros de iteração
  const dataToDisplay = useMemo(() => {
    try {
      // Garantir que valoresData seja sempre um array
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

  // Criar uma cópia estável para ordenação usando useMemo para garantir que reordena quando necessário
  // IMPORTANTE: useMemo deve estar antes de qualquer early return (regras dos hooks do React)
  const sortedValores: ValoresEntregador[] = useMemo(() => {
    // Garantir que dataToDisplay seja sempre um array antes de fazer spread
    if (!Array.isArray(dataToDisplay) || dataToDisplay.length === 0) return [];
    
    // Criar uma cópia do array para não mutar o original
    const dataCopy = [...dataToDisplay];
    
    return dataCopy.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Tratar valores nulos/undefined - colocar no final
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Se for campo de string (nome_entregador ou id_entregador)
      if (sortField === 'nome_entregador' || sortField === 'id_entregador') {
        const aStr = String(aValue).toLowerCase().trim();
        const bStr = String(bValue).toLowerCase().trim();
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base', numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Para valores numéricos (total_taxas, numero_corridas_aceitas, taxa_media)
      // Garantir conversão correta para número
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      
      // Comparação numérica precisa
      const comparison = aNum - bNum;
      
      // Se os números forem iguais, manter ordem estável usando nome como desempate
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

  // IMPORTANTE: Todos os hooks devem estar ANTES de qualquer early return

  // Calcular estatísticas gerais
  // Garantir que dataToDisplay seja array antes de fazer reduce (otimizado com useMemo)
  const dataArray = useMemo(() => {
    return Array.isArray(dataToDisplay) ? dataToDisplay : [];
  }, [dataToDisplay]);
  
  // Calcular totais usando useMemo para evitar recálculos desnecessários
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
      return <span className="ml-1 text-slate-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Early returns APÓS todos os hooks
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-3 sm:border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
          <p className="mt-4 text-sm sm:text-base lg:text-lg font-semibold text-blue-700 dark:text-blue-300">Carregando valores...</p>
        </div>
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
            className="mt-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!valoresData || !Array.isArray(valoresData) || valoresData.length === 0) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 text-center shadow-lg dark:border-amber-900 dark:bg-amber-950/30 animate-fade-in">
        <div className="text-5xl sm:text-6xl mb-4">💰</div>
        <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-100">Nenhum valor encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Barra de Pesquisa */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
          
          <CardContent className="relative p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Pesquisar entregador por nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 pl-12 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
              ) : (
                <span className="text-lg">🔍</span>
              )}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {isSearching ? (
                'Pesquisando...'
              ) : (
                `Encontrado${totalEntregadores === 1 ? '' : 's'} ${totalEntregadores} resultado${totalEntregadores === 1 ? '' : 's'}`
              )}
            </p>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total Geral"
          value={totalGeral}
          icon="💰"
          color="green"
        />
        <MetricCard
          title="Entregadores"
          value={totalEntregadores}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Total Corridas"
          value={totalCorridas}
          icon="🚗"
          color="blue"
        />
        <MetricCard
          title="Taxa Média"
          value={taxaMediaGeral}
          icon="📊"
          color="blue"
        />
      </div>

      {/* Tabela de Valores */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <Card className="relative border-0 shadow-xl bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-blue-400/5 rounded-full blur-3xl"></div>
          
          <CardHeader className="relative pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                  Valores por Entregador
                </CardTitle>
                <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">
                  Clique nos cabeçalhos para ordenar • Total de {totalEntregadores} entregadores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-lg overflow-hidden">
              {/* Cabeçalho fixo */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-700 border-b-2 border-blue-200 dark:border-slate-600">
                <div className="grid grid-cols-4 gap-4 px-4 py-4 min-w-[600px]">
                  <div 
                    className="cursor-pointer text-left text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20 whitespace-nowrap"
                    onClick={() => handleSort('nome_entregador')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <span className="truncate">Entregador</span>
                      <SortIcon field="nome_entregador" />
                    </div>
                  </div>
                  <div 
                    className="cursor-pointer text-right text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20 whitespace-nowrap"
                    onClick={() => handleSort('total_taxas')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-base">💵</span>
                      <span className="truncate">Total</span>
                      <SortIcon field="total_taxas" />
                    </div>
                  </div>
                  <div 
                    className="cursor-pointer text-right text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20 whitespace-nowrap"
                    onClick={() => handleSort('numero_corridas_aceitas')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-base">🚗</span>
                      <span className="truncate">Corridas</span>
                      <SortIcon field="numero_corridas_aceitas" />
                    </div>
                  </div>
                  <div 
                    className="cursor-pointer text-right text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-blue-950/20 whitespace-nowrap"
                    onClick={() => handleSort('taxa_media')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-base">📊</span>
                      <span className="truncate">Média</span>
                      <SortIcon field="taxa_media" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lista otimizada com scroll nativo (limites nas queries já reduzem o número de itens) */}
              <div className="max-h-[500px] sm:max-h-[600px] overflow-x-auto overflow-y-auto">
                {sortedValores.length > 0 ? (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
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
                          className="grid grid-cols-4 gap-4 px-4 py-3 items-center hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors min-w-[600px]"
                        >
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                              {ranking}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{nomeEntregador}</span>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100 font-bold whitespace-nowrap">
                              {formatarReal(totalTaxas)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                              {numeroCorridas.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 font-semibold whitespace-nowrap">
                              {formatarReal(taxaMedia)}
                            </Badge>
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
    </div>
  );
});

ValoresView.displayName = 'ValoresView';

export default ValoresView;
