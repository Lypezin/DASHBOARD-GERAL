'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MarketingFilters, MarketingTotals, MarketingCityData, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import MarketingCard from '@/components/MarketingCard';
import MarketingCityCard from '@/components/MarketingCityCard';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';

const IS_DEV = process.env.NODE_ENV === 'development';

// Constantes para separação do ABC 2.0
const SANTO_ANDRE_SUB_PRACAS = ['Vila Aquino', 'São Caetano'];
const SAO_BERNARDO_SUB_PRACAS = ['Diadema', 'Nova petrópolis', 'Rudge Ramos'];

// Lista de cidades para os cartões
const CIDADES = [
  'São Paulo 2.0',
  'Salvador 2.0',
  'Guarulhos 2.0',
  'Manaus 2.0',
  'Sorocaba 2.0',
  'Taboão da Serra e Embu das Artes 2.0',
  'Santo André',
  'São Bernardo',
];

// Função auxiliar para construir query com filtro de data
function buildDateFilterQuery(
  query: any,
  dateColumn: string,
  filter: MarketingDateFilter
) {
  if (!filter.dataInicial && !filter.dataFinal) {
    query = query.not(dateColumn, 'is', null);
    return query;
  }
  
  if (filter.dataInicial) {
    query = query.gte(dateColumn, filter.dataInicial);
  }
  if (filter.dataFinal) {
    query = query.lte(dateColumn, filter.dataFinal);
  }
  
  return query;
}

// Função auxiliar para construir query de cidade
function buildCityQuery(query: any, cidade: string) {
  if (cidade === 'Santo André') {
    return query
      .eq('regiao_atuacao', 'ABC 2.0')
      .in('sub_praca_abc', SANTO_ANDRE_SUB_PRACAS);
  } else if (cidade === 'São Bernardo') {
    return query
      .eq('regiao_atuacao', 'ABC 2.0')
      .in('sub_praca_abc', SAO_BERNARDO_SUB_PRACAS);
  } else if (cidade === 'ABC 2.0') {
    const excludedSubPracas = [...SANTO_ANDRE_SUB_PRACAS, ...SAO_BERNARDO_SUB_PRACAS];
    let abcQuery = query.eq('regiao_atuacao', 'ABC 2.0');
    excludedSubPracas.forEach(subPraca => {
      abcQuery = abcQuery.neq('sub_praca_abc', subPraca);
    });
    abcQuery = abcQuery.not('sub_praca_abc', 'is', null);
    return abcQuery;
  } else {
    return query.eq('regiao_atuacao', cidade);
  }
}

const MarketingDashboardView = React.memo(function MarketingDashboardView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<MarketingTotals>({
    criado: 0,
    enviado: 0,
    liberado: 0,
    rodandoInicio: 0,
  });
  const [citiesData, setCitiesData] = useState<MarketingCityData[]>([]);
  const [filters, setFilters] = useState<MarketingFilters>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
    filtroRodouDia: { dataInicial: null, dataFinal: null },
  });

  const fetchTotals = async () => {
    try {
      // Tentar usar RPC primeiro
      const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        criado: number;
        enviado: number;
        liberado: number;
        rodando_inicio: number;
      }>>('get_marketing_totals', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
        rodou_dia_inicial: filters.filtroRodouDia.dataInicial || null,
        rodou_dia_final: filters.filtroRodouDia.dataFinal || null,
      });

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const totalsData = rpcData[0];
        setTotals({
          criado: totalsData.criado || 0,
          enviado: totalsData.enviado || 0,
          liberado: totalsData.liberado || 0,
          rodandoInicio: totalsData.rodando_inicio || 0,
        });
        return;
      }

      // Fallback para queries diretas
      if (IS_DEV) {
        safeLog.warn('RPC get_marketing_totals não disponível, usando fallback');
      }

      const { count: criadoCount } = await supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });

      let enviadoQuery = supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });
      enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
      const { count: enviadoCount } = await enviadoQuery;

      let liberadoQuery = supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });
      liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
      const { count: liberadoCount } = await liberadoQuery;

      let rodandoQuery = supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true });
      rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);
      const { count: rodandoCount } = await rodandoQuery;

      setTotals({
        criado: criadoCount || 0,
        enviado: enviadoCount || 0,
        liberado: liberadoCount || 0,
        rodandoInicio: rodandoCount || 0,
      });
    } catch (err: any) {
      safeLog.error('Erro ao buscar totais de Marketing:', err);
      throw err;
    }
  };

  const fetchCitiesData = async () => {
    try {
      // Tentar usar RPC primeiro
      const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        cidade: string;
        enviado: number;
        liberado: number;
        rodando_inicio: number;
      }>>('get_marketing_cities_data', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
        rodou_dia_inicial: filters.filtroRodouDia.dataInicial || null,
        rodou_dia_final: filters.filtroRodouDia.dataFinal || null,
      });

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        // Mapear dados RPC para o formato esperado, garantindo todas as cidades
        const rpcMap = new Map(rpcData.map(item => [item.cidade, item]));
        const citiesDataArray: MarketingCityData[] = CIDADES.map(cidade => {
          const rpcItem = rpcMap.get(cidade);
          return {
            cidade,
            enviado: rpcItem?.enviado || 0,
            liberado: rpcItem?.liberado || 0,
            rodandoInicio: rpcItem?.rodando_inicio || 0,
          };
        });
        setCitiesData(citiesDataArray);
        return;
      }

      // Fallback para queries diretas
      if (IS_DEV) {
        safeLog.warn('RPC get_marketing_cities_data não disponível, usando fallback');
      }

      const citiesDataArray: MarketingCityData[] = [];

      for (const cidade of CIDADES) {
        let enviadoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        enviadoQuery = buildCityQuery(enviadoQuery, cidade);
        enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
        const { count: enviadoCount } = await enviadoQuery;

        let liberadoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        liberadoQuery = buildCityQuery(liberadoQuery, cidade);
        liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
        const { count: liberadoCount } = await liberadoQuery;

        let rodandoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        rodandoQuery = buildCityQuery(rodandoQuery, cidade);
        rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);
        const { count: rodandoCount } = await rodandoQuery;

        citiesDataArray.push({
          cidade,
          enviado: enviadoCount || 0,
          liberado: liberadoCount || 0,
          rodandoInicio: rodandoCount || 0,
        });
      }

      setCitiesData(citiesDataArray);
    } catch (err: any) {
      safeLog.error('Erro ao buscar dados das cidades:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchTotals(), fetchCitiesData()]);
      } catch (err: any) {
        safeLog.error('Erro ao buscar dados de Marketing:', err);
        setError(err.message || 'Erro ao carregar dados de Marketing');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.filtroLiberacao, filters.filtroEnviados, filters.filtroRodouDia]);

  const handleFilterChange = (filterName: keyof MarketingFilters, filter: MarketingDateFilter) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: filter,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando dados de Marketing...</p>
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
            className="mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MarketingDateFilterComponent
          label="Filtro de Liberação"
          filter={filters.filtroLiberacao}
          onFilterChange={(filter) => handleFilterChange('filtroLiberacao', filter)}
        />
        <MarketingDateFilterComponent
          label="Filtro de Enviados"
          filter={filters.filtroEnviados}
          onFilterChange={(filter) => handleFilterChange('filtroEnviados', filter)}
        />
        <MarketingDateFilterComponent
          label="Filtro de Rodou Dia"
          filter={filters.filtroRodouDia}
          onFilterChange={(filter) => handleFilterChange('filtroRodouDia', filter)}
        />
      </div>

      {/* Cartões Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketingCard
          title="Criado"
          value={totals.criado}
          icon="📊"
          color="blue"
        />
        <MarketingCard
          title="Enviado"
          value={totals.enviado}
          icon="📤"
          color="green"
        />
        <MarketingCard
          title="Liberado"
          value={totals.liberado}
          icon="✅"
          color="purple"
        />
        <MarketingCard
          title="Rodando Início"
          value={totals.rodandoInicio}
          icon="🚀"
          color="orange"
        />
      </div>

      {/* Cartões de Cidade */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Métricas por Cidade
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {citiesData.map((cityData) => (
            <MarketingCityCard
              key={cityData.cidade}
              cidade={cityData.cidade}
              enviado={cityData.enviado}
              liberado={cityData.liberado}
              rodandoInicio={cityData.rodandoInicio}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

MarketingDashboardView.displayName = 'MarketingDashboardView';

export default MarketingDashboardView;

