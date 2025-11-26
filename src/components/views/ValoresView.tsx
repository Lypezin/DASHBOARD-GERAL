import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ValoresEntregador } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { AlertCircle, DollarSign } from 'lucide-react';
import { ValoresStatsCards } from './valores/ValoresStatsCards';
import { ValoresTable } from './valores/ValoresTable';
import { ValoresSearch } from './valores/ValoresSearch';

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
      <ValoresSearch
        searchTerm={searchTerm}
        isSearching={isSearching}
        totalResults={totalEntregadores}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
      />

      <ValoresStatsCards
        totalGeral={totalGeral}
        totalEntregadores={totalEntregadores}
        totalCorridas={totalCorridas}
        taxaMediaGeral={taxaMediaGeral}
        formatarReal={formatarReal}
      />

      <ValoresTable
        sortedValores={sortedValores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        formatarReal={formatarReal}
      />
    </div>
  );
});

ValoresView.displayName = 'ValoresView';

export default ValoresView;
