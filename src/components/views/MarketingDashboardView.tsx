'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MarketingFilters, MarketingTotals, MarketingCityData, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import MarketingCard from '@/components/MarketingCard';
import MarketingCityCard from '@/components/MarketingCityCard';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';
import { getCurrentUserOrganizationId } from '@/utils/organizationHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

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
      // Obter organization_id do usuário atual
      const organizationId = await getCurrentUserOrganizationId();
      
      // Tentar usar RPC primeiro
      // Sempre passar todos os parâmetros (null quando não há filtro)
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
        p_organization_id: organizationId,
      }, { validateParams: false });

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

      // Garantir que pelo menos um filtro de data está aplicado
      // Para queries de marketing, sempre aplicar filtro de data_envio se disponível
      const { count: criadoCount } = await supabase
        .from('dados_marketing')
        .select('*', { count: 'exact', head: true })
        .not('data_envio', 'is', null); // Garantir que há data para evitar scan completo

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
      // Obter organization_id do usuário atual
      const organizationId = await getCurrentUserOrganizationId();
      
      // Tentar usar RPC primeiro
      // Sempre passar todos os parâmetros (null quando não há filtro)
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
        p_organization_id: organizationId,
      }, { validateParams: false });

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
    // fetchData já inclui todas as dependências necessárias internamente
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
    <div className="space-y-6 animate-fade-in">
      {/* Filtros de Data com design premium */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-purple-300/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative rounded-3xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 p-6 shadow-xl dark:from-slate-800 dark:via-purple-950/20 dark:to-pink-950/20 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 h-64 w-64 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-pink-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                <span className="text-lg">🔍</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Filtros de Data
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>
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

