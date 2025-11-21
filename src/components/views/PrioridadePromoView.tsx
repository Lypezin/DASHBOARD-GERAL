import React, { useState, useMemo } from 'react';
import { Entregador, EntregadoresData } from '@/types';
import MetricCard from '../MetricCard';
import { PrioridadeFilters } from './prioridade/PrioridadeFilters';
import { PrioridadeSearch } from './prioridade/PrioridadeSearch';
import { PrioridadeTable } from './prioridade/PrioridadeTable';
import { usePrioridadeSearch } from './prioridade/usePrioridadeSearch';
import {
  calcularPercentualAceitas,
  calcularPercentualCompletadas,
  getAderenciaColor,
  getAderenciaBg,
  getRejeicaoColor,
  getRejeicaoBg,
  getAceitasColor,
  getAceitasBg,
  getCompletadasColor,
  getCompletadasBg,
} from './prioridade/PrioridadeUtils';

const PrioridadePromoView = React.memo(function PrioridadePromoView({
  entregadoresData,
  loading,
}: {
  entregadoresData: EntregadoresData | null;
  loading: boolean;
}) {
  const [sortField, setSortField] = useState<keyof Entregador | 'percentual_aceitas' | 'percentual_completadas'>('aderencia_percentual');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAderencia, setFiltroAderencia] = useState<string>('');
  const [filtroRejeicao, setFiltroRejeicao] = useState<string>('');
  const [filtroCompletadas, setFiltroCompletadas] = useState<string>('');
  const [filtroAceitas, setFiltroAceitas] = useState<string>('');

  // Hook para pesquisa
  const { searchResults, isSearching } = usePrioridadeSearch(searchTerm, entregadoresData);

  // Usar resultados da pesquisa se houver termo de busca e resultados, senão usar dados originais
  // Usar useMemo para evitar recriação desnecessária
  const dataToDisplay = useMemo(() => {
    const baseData = entregadoresData?.entregadores;
    const baseArray = Array.isArray(baseData) ? baseData : [];
    return (searchTerm.trim() && Array.isArray(searchResults) && searchResults.length > 0) ? searchResults : baseArray;
  }, [searchTerm, searchResults, entregadoresData]);

  // Aplicar filtros de % de aderência, rejeição, completadas e aceitas
  const dataFiltrada = useMemo(() => {
    if (!Array.isArray(dataToDisplay)) return [];
    let filtered = [...dataToDisplay];
    
    // Filtro por % de aderência (mostrar apenas quem tem o valor ou acima)
    if (filtroAderencia.trim()) {
      const aderenciaMin = parseFloat(filtroAderencia);
      if (!isNaN(aderenciaMin)) {
        filtered = filtered.filter(e => (e.aderencia_percentual ?? 0) >= aderenciaMin);
      }
    }
    
    // Filtro por % de rejeição (mostrar apenas quem tem o valor ou abaixo)
    if (filtroRejeicao.trim()) {
      const rejeicaoMax = parseFloat(filtroRejeicao);
      if (!isNaN(rejeicaoMax)) {
        filtered = filtered.filter(e => (e.rejeicao_percentual ?? 0) <= rejeicaoMax);
      }
    }
    
    // Filtro por % de completadas (mostrar apenas quem tem o valor ou acima)
    // % completadas = (corridas_completadas / corridas_ofertadas) * 100
    if (filtroCompletadas.trim()) {
      const completadasMin = parseFloat(filtroCompletadas);
      if (!isNaN(completadasMin)) {
        filtered = filtered.filter(e => {
          const corridasOfertadas = e.corridas_ofertadas || 0;
          if (corridasOfertadas === 0) return false;
          const percentualCompletadas = (e.corridas_completadas / corridasOfertadas) * 100;
          return percentualCompletadas >= completadasMin;
        });
      }
    }
    
    // Filtro por % de aceitas (mostrar apenas quem tem o valor ou acima)
    // % aceitas = (corridas_aceitas / corridas_ofertadas) * 100
    if (filtroAceitas.trim()) {
      const aceitasMin = parseFloat(filtroAceitas);
      if (!isNaN(aceitasMin)) {
        filtered = filtered.filter(e => {
          const corridasOfertadas = e.corridas_ofertadas || 0;
          if (corridasOfertadas === 0) return false;
          const percentualAceitas = (e.corridas_aceitas / corridasOfertadas) * 100;
          return percentualAceitas >= aceitasMin;
        });
      }
    }
    
    return filtered;
  }, [dataToDisplay, filtroAderencia, filtroRejeicao, filtroCompletadas, filtroAceitas]);

  // Criar uma cópia estável para ordenação usando useMemo para garantir que reordena quando necessário
  // IMPORTANTE: useMemo deve estar antes de qualquer early return (regras dos hooks do React)
  const sortedEntregadores: Entregador[] = useMemo(() => {
    if (!dataFiltrada || dataFiltrada.length === 0) return [];
    
    // Criar uma cópia do array para não mutar o original
    const dataCopy = [...dataFiltrada];
    
    return dataCopy.sort((a, b) => {
      // Campos calculados que precisam de tratamento especial
      if (sortField === 'percentual_aceitas') {
        const aPercent = calcularPercentualAceitas(a);
        const bPercent = calcularPercentualAceitas(b);
        const comparison = aPercent - bPercent;
        if (comparison === 0) {
          return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (sortField === 'percentual_completadas') {
        const aPercent = calcularPercentualCompletadas(a);
        const bPercent = calcularPercentualCompletadas(b);
        const comparison = aPercent - bPercent;
        if (comparison === 0) {
          return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      const aValue = a[sortField as keyof Entregador];
      const bValue = b[sortField as keyof Entregador];
      
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
        return a.nome_entregador.localeCompare(b.nome_entregador, 'pt-BR');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dataFiltrada, sortField, sortDirection]);

  const handleSort = (field: keyof Entregador | 'percentual_aceitas' | 'percentual_completadas') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as keyof Entregador | 'percentual_aceitas' | 'percentual_completadas');
      setSortDirection('desc');
    }
  };

  const handleClearFilters = () => {
    setFiltroAderencia('');
    setFiltroRejeicao('');
    setFiltroCompletadas('');
    setFiltroAceitas('');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700 dark:text-blue-200">Carregando dados de prioridade...</p>
        </div>
      </div>
    );
  }

  if (!entregadoresData) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados de prioridade</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">A função listar_entregadores não está disponível ou ocorreu um erro no servidor (500). Verifique os logs do banco de dados.</p>
      </div>
    );
  }

  if (entregadoresData.entregadores.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Nenhum entregador encontrado</p>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Tente ajustar os filtros para ver os dados.</p>
      </div>
    );
  }


  // Calcular estatísticas gerais com base nos dados filtrados
  const totalOfertadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_ofertadas, 0);
  const totalAceitas = dataFiltrada.reduce((sum, e) => sum + e.corridas_aceitas, 0);
  const totalRejeitadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_rejeitadas, 0);
  const totalCompletadas = dataFiltrada.reduce((sum, e) => sum + e.corridas_completadas, 0);
  const totalEntregadores = dataFiltrada.length;
  const aderenciaMedia = totalEntregadores > 0 ? dataFiltrada.reduce((sum, e) => sum + e.aderencia_percentual, 0) / totalEntregadores : 0;
  const rejeicaoMedia = totalEntregadores > 0 ? dataFiltrada.reduce((sum, e) => sum + e.rejeicao_percentual, 0) / totalEntregadores : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PrioridadeFilters
        filtroAderencia={filtroAderencia}
        filtroRejeicao={filtroRejeicao}
        filtroCompletadas={filtroCompletadas}
        filtroAceitas={filtroAceitas}
        onAderenciaChange={setFiltroAderencia}
        onRejeicaoChange={setFiltroRejeicao}
        onCompletadasChange={setFiltroCompletadas}
        onAceitasChange={setFiltroAceitas}
        onClearFilters={handleClearFilters}
      />

      <PrioridadeSearch
        searchTerm={searchTerm}
        isSearching={isSearching}
        totalResults={dataFiltrada.length}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-6">
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
          color="blue"
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
          color="blue"
        />
        <MetricCard
          title="Médias"
          value={aderenciaMedia}
          icon="📊"
          percentage={aderenciaMedia}
          percentageLabel="aderência"
          color="blue"
        />
      </div>
      <PrioridadeTable
        sortedEntregadores={sortedEntregadores}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        calcularPercentualAceitas={calcularPercentualAceitas}
        calcularPercentualCompletadas={calcularPercentualCompletadas}
        getAderenciaColor={getAderenciaColor}
        getAderenciaBg={getAderenciaBg}
        getRejeicaoColor={getRejeicaoColor}
        getRejeicaoBg={getRejeicaoBg}
        getAceitasColor={getAceitasColor}
        getAceitasBg={getAceitasBg}
        getCompletadasColor={getCompletadasColor}
        getCompletadasBg={getCompletadasBg}
      />
    </div>
  );
});

PrioridadePromoView.displayName = 'PrioridadePromoView';

export default PrioridadePromoView;
