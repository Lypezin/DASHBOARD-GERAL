import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Entregador, EntregadoresData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import MetricCard from '../MetricCard';

const IS_DEV = process.env.NODE_ENV === 'development';

function EntregadoresView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof Entregador>('aderencia_percentual');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Entregador[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const { data, error } = await safeRpc<Entregador[]>('pesquisar_entregadores', {
          termo_busca: searchTerm.trim()
        }, {
          timeout: 30000,
          validateParams: true
        });

        if (error) throw error;
        setSearchResults(data?.entregadores || []);
      } catch (err) {
        if (IS_DEV) safeLog.error('Erro ao pesquisar entregadores:', err);
        // Fallback para pesquisa local
        const filtered = (entregadoresData?.entregadores || []).filter(e => 
          e.nome_entregador.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.id_entregador.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [searchTerm, entregadoresData]);

  // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
  // Usar useMemo para evitar recriação desnecessária
  const dataToDisplay = useMemo(() => {
    // Garantir que entregadoresData.entregadores existe e é um array
    const baseData = entregadoresData?.entregadores;
    const baseArray = Array.isArray(baseData) ? baseData : [];
    return (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) ? searchResults : baseArray;
  }, [searchTerm, searchResults, entregadoresData]);

  // Criar uma cópia estável para ordenação usando useMemo para garantir que reordena quando necessário
  // IMPORTANTE: useMemo deve estar antes de qualquer early return (regras dos hooks do React)
  const sortedEntregadores: Entregador[] = useMemo(() => {
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
      
      // Para valores numéricos (todos os outros campos)
      // Garantir conversão correta para número
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      
      // Comparação numérica precisa
      const comparison = aNum - bNum;
      
      // Se os números forem iguais, manter ordem estável usando nome como desempate
      if (comparison === 0) {
        const aNome = a.nome_entregador || '';
        const bNome = b.nome_entregador || '';
        return aNome.localeCompare(bNome, 'pt-BR');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dataToDisplay, sortField, sortDirection]);

  const handleSort = (field: keyof Entregador) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar entregadores</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">A função pesquisar_entregadores não está disponível ou ocorreu um erro no servidor (500). Verifique os logs do banco de dados.</p>
      </div>
    );
  }

  // Garantir que entregadores existe e é um array
  const entregadores = Array.isArray(entregadoresData?.entregadores) 
    ? entregadoresData.entregadores 
    : [];

  if (entregadores.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum entregador encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: keyof Entregador }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-slate-400">⇅</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getAderenciaColor = (aderencia: number) => {
    if (aderencia >= 90) return 'text-emerald-700 dark:text-emerald-400';
    if (aderencia >= 70) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const getAderenciaBg = (aderencia: number) => {
    if (aderencia >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (aderencia >= 70) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-rose-50 dark:bg-rose-950/30';
  };

  const getRejeicaoColor = (rejeicao: number) => {
    if (rejeicao <= 10) return 'text-emerald-700 dark:text-emerald-400';
    if (rejeicao <= 30) return 'text-amber-700 dark:text-amber-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const getRejeicaoBg = (rejeicao: number) => {
    if (rejeicao <= 10) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (rejeicao <= 30) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-rose-50 dark:bg-rose-950/30';
  };

  // Calcular estatísticas gerais
  const totalOfertadas = dataToDisplay.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
  const totalAceitas = dataToDisplay.reduce((sum, e) => sum + e.corridas_aceitas, 0);
  const totalRejeitadas = dataToDisplay.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
  const totalCompletadas = dataToDisplay.reduce((sum, e) => sum + e.corridas_completadas, 0);
  const totalEntregadores = dataToDisplay.length;
  const aderenciaMedia = totalEntregadores > 0 ? dataToDisplay.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores : 0;
  const rejeicaoMedia = totalEntregadores > 0 ? dataToDisplay.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores : 0;

  return (
    <div className="space-y-6 animate-fade-in">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        <MetricCard
          title="Entregadores"
          value={totalEntregadores}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Ofertadas"
          value={totalOfertadas}
          icon="📢"
          color="purple"
        />
        <MetricCard
          title="Aceitas"
          value={totalAceitas}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Rejeitadas"
          value={totalRejeitadas}
          icon="❌"
          color="red"
        />
        <MetricCard
          title="Completadas"
          value={totalCompletadas}
          icon="🏁"
          color="cyan"
        />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Médias</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Aderência:</span>
                <span className={`text-sm font-bold ${getAderenciaColor(aderenciaMedia)}`}>{aderenciaMedia.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Rejeição:</span>
                <span className={`text-sm font-bold ${getRejeicaoColor(rejeicaoMedia)}`}>{rejeicaoMedia.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Entregadores */}
      <div className="rounded-xl border border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-900">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                <th 
                  className="cursor-pointer px-6 py-4 text-left text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('nome_entregador')}
                >
                  Entregador <SortIcon field="nome_entregador" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_ofertadas')}
                >
                  Ofertadas <SortIcon field="corridas_ofertadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_aceitas')}
                >
                  Aceitas <SortIcon field="corridas_aceitas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_rejeitadas')}
                >
                  Rejeitadas <SortIcon field="corridas_rejeitadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('corridas_completadas')}
                >
                  Completadas <SortIcon field="corridas_completadas" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('aderencia_percentual')}
                >
                  Aderência <SortIcon field="aderencia_percentual" />
                </th>
                <th 
                  className="cursor-pointer px-6 py-4 text-center text-sm font-bold text-blue-900 transition-colors hover:bg-blue-100 dark:text-blue-100 dark:hover:bg-blue-900/50"
                  onClick={() => handleSort('rejeicao_percentual')}
                >
                  % Rejeição <SortIcon field="rejeicao_percentual" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEntregadores.map((entregador, index) => {
                // Garantir que o número seja sempre sequencial (ranking)
                const ranking = index + 1;
                
                return (
                <tr
                  key={`${entregador.id_entregador}-${sortField}-${sortDirection}-${ranking}`}
                  className={`border-b border-blue-100 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/20 ${
                    ranking % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/30 dark:bg-slate-800/30'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{entregador.nome_entregador}</td>
                  <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">{entregador.corridas_ofertadas}</td>
                  <td className="px-6 py-4 text-center text-emerald-700 dark:text-emerald-400">{entregador.corridas_aceitas}</td>
                  <td className="px-6 py-4 text-center text-rose-700 dark:text-rose-400">{entregador.corridas_rejeitadas}</td>
                  <td className="px-6 py-4 text-center text-blue-700 dark:text-blue-400">{entregador.corridas_completadas}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${getAderenciaBg(entregador.aderencia_percentual ?? 0)}`}>
                      <span className={`text-lg font-bold ${getAderenciaColor(entregador.aderencia_percentual ?? 0)}`}>
                        {(entregador.aderencia_percentual ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${getRejeicaoBg(entregador.rejeicao_percentual ?? 0)}`}>
                      <span className={`text-lg font-bold ${getRejeicaoColor(entregador.rejeicao_percentual ?? 0)}`}>
                        {(entregador.rejeicao_percentual ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EntregadoresView;
