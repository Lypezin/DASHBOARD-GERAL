import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ValoresEntregador, Entregador, EntregadoresData } from '@/types';
import MetricCard from '../MetricCard';

const IS_DEV = process.env.NODE_ENV === 'development';

function ValoresView({
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
        const { data, error } = await supabase.rpc('pesquisar_valores_entregadores', {
          termo_busca: searchTerm.trim()
        });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        if (IS_DEV) console.error('Erro ao pesquisar valores:', err);
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
    // Garantir que valoresData seja sempre um array
    const valoresArray = Array.isArray(valoresData) ? valoresData : [];
    
    if (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) {
      return searchResults;
    }
    
    return valoresArray;
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

  const totalEntregadores = useMemo(() => dataArray.length, [dataArray]);

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

  if (!valoresData || valoresData.length === 0) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 text-center shadow-lg dark:border-amber-900 dark:bg-amber-950/30 animate-fade-in">
        <div className="text-5xl sm:text-6xl mb-4">💰</div>
        <p className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-100">Nenhum valor encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Barra de Pesquisa */}
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Pesquisar entregador por nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-12 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
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
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
          color="purple"
        />
        <MetricCard
          title="Taxa Média"
          value={taxaMediaGeral}
          icon="📊"
          color="red"
        />
      </div>

      {/* Tabela de Valores */}
      <div className="rounded-xl sm:rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">💰</span>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">Valores por Entregador</h3>
          </div>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Clique nos cabeçalhos para ordenar • Total de {totalEntregadores} entregadores
          </p>
        </div>
        
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('nome_entregador')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">👤</span>
                    <span className="truncate">Entregador</span>
                    <SortIcon field="nome_entregador" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('total_taxas')}
                >
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">💵</span>
                    <span className="truncate">Total</span>
                    <SortIcon field="total_taxas" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('numero_corridas_aceitas')}
                >
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">🚗</span>
                    <span className="truncate">Corridas</span>
                    <SortIcon field="numero_corridas_aceitas" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => handleSort('taxa_media')}
                >
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-base">📊</span>
                    <span className="truncate">Média</span>
                    <SortIcon field="taxa_media" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedValores.map((entregador, index) => {
                // Validação de segurança: garantir que entregador existe
                if (!entregador) return null;
                
                // Garantir que o número seja sempre sequencial (ranking)
                const ranking = index + 1;
                
                // Garantir que todos os valores numéricos existam antes de usar
                // Converter para número para garantir que seja numérico
                const totalTaxas = Number(entregador.total_taxas) || 0;
                const numeroCorridas = Number(entregador.numero_corridas_aceitas) || 0;
                const taxaMedia = Number(entregador.taxa_media) || 0;
                const nomeEntregador = String(entregador.nome_entregador || entregador.id_entregador || 'N/A');
                const idEntregador = String(entregador.id_entregador || `entregador-${index}`);
                
                return (
                <tr 
                  key={`${idEntregador}-${sortField}-${sortDirection}-${ranking}`}
                  className="group transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-sm">
                        {ranking}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{nomeEntregador}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                      {formatarReal(totalTaxas)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      {numeroCorridas.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    <span className="inline-flex items-center rounded-lg bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                      {formatarReal(taxaMedia)}
                    </span>
                  </td>
                </tr>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ValoresView;
