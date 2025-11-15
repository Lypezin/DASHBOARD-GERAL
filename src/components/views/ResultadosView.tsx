'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MarketingFilters, MarketingDateFilter, AtendenteCidadeData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import MarketingCard from '@/components/MarketingCard';
import AtendenteCard from '@/components/AtendenteCard';

const IS_DEV = process.env.NODE_ENV === 'development';

// Lista de atendentes
const ATENDENTES = [
  'Fernanda Raphaelly',
  'Beatriz Angelo',
  'Melissa',
  'Carolini Braguini',
];

// Lista de cidades (mesmas do MarketingDashboardView)
const SANTO_ANDRE_SUB_PRACAS = ['Vila Aquino', 'São Caetano'];
const SAO_BERNARDO_SUB_PRACAS = ['Diadema', 'Nova petrópolis', 'Rudge Ramos'];

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

// Mapeamento de fotos dos atendentes
const ATENDENTES_FOTOS: { [key: string]: string | null } = {
  'Fernanda Raphaelly': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/FERNANDA%20FOTO.png',
  'Beatriz Angelo': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/FOTO%20BEATRIZ.png',
  'Melissa': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/MELISSA%20FOTO.png',
  'Carolini Braguini': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/CAROL%20FOTO.jpg',
};

// Função auxiliar para construir query de cidade (reutilizada de MarketingDashboardView)
function buildCityQuery(query: any, cidade: string) {
  if (cidade === 'Santo André') {
    return query
      .eq('regiao_atuacao', 'ABC 2.0')
      .in('sub_praca_abc', SANTO_ANDRE_SUB_PRACAS);
  } else if (cidade === 'São Bernardo') {
    return query
      .eq('regiao_atuacao', 'ABC 2.0')
      .in('sub_praca_abc', SAO_BERNARDO_SUB_PRACAS);
  } else {
    return query.eq('regiao_atuacao', cidade);
  }
}

// Função auxiliar para construir query com filtro de data
function buildDateFilterQuery(
  query: any,
  dateColumn: string,
  filter: MarketingDateFilter
) {
  // Se não há filtro aplicado, contar apenas registros onde a data não é null
  if (!filter.dataInicial && !filter.dataFinal) {
    query = query.not(dateColumn, 'is', null);
    return query;
  }
  
  // Se há filtro, aplicar intervalo
  if (filter.dataInicial) {
    query = query.gte(dateColumn, filter.dataInicial);
  }
  if (filter.dataFinal) {
    // Usar lte para incluir o dia final completo
    query = query.lte(dateColumn, filter.dataFinal);
  }
  
  return query;
}

interface AtendenteData {
  nome: string;
  enviado: number;
  liberado: number;
  fotoUrl?: string | null;
  cidades?: AtendenteCidadeData[];
}

interface TotaisData {
  totalEnviado: number;
  totalLiberado: number;
}

const ResultadosView = React.memo(function ResultadosView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atendentesData, setAtendentesData] = useState<AtendenteData[]>([]);
  const [totais, setTotais] = useState<TotaisData>({
    totalEnviado: 0,
    totalLiberado: 0,
  });
  const [filters, setFilters] = useState<{
    filtroLiberacao: MarketingDateFilter;
    filtroEnviados: MarketingDateFilter;
  }>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
  });

  // Função para buscar dados dos atendentes
  const fetchAtendentesData = async () => {
    try {
      const atendentesDataArray: AtendenteData[] = [];
      let totalEnviado = 0;
      let totalLiberado = 0;

      for (const atendente of ATENDENTES) {
        // Enviado (com filtro de Enviados)
        let enviadoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        enviadoQuery = enviadoQuery.eq('responsavel', atendente);
        enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
        const { count: enviadoCount } = await enviadoQuery;

        // Liberado (com filtro de Liberação)
        let liberadoQuery = supabase
          .from('dados_marketing')
          .select('*', { count: 'exact', head: true });
        liberadoQuery = liberadoQuery.eq('responsavel', atendente);
        liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
        const { count: liberadoCount } = await liberadoQuery;

        const enviado = enviadoCount || 0;
        const liberado = liberadoCount || 0;
        totalEnviado += enviado;
        totalLiberado += liberado;

        // Buscar métricas por cidade para este atendente
        const cidadesData: AtendenteCidadeData[] = [];
        for (const cidade of CIDADES) {
          // Enviado por cidade
          let enviadoCidadeQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });
          enviadoCidadeQuery = enviadoCidadeQuery.eq('responsavel', atendente);
          enviadoCidadeQuery = buildCityQuery(enviadoCidadeQuery, cidade);
          enviadoCidadeQuery = buildDateFilterQuery(enviadoCidadeQuery, 'data_envio', filters.filtroEnviados);
          const { count: enviadoCidadeCount } = await enviadoCidadeQuery;

          // Liberado por cidade
          let liberadoCidadeQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });
          liberadoCidadeQuery = liberadoCidadeQuery.eq('responsavel', atendente);
          liberadoCidadeQuery = buildCityQuery(liberadoCidadeQuery, cidade);
          liberadoCidadeQuery = buildDateFilterQuery(liberadoCidadeQuery, 'data_liberacao', filters.filtroLiberacao);
          const { count: liberadoCidadeCount } = await liberadoCidadeQuery;

          cidadesData.push({
            atendente,
            cidade,
            enviado: enviadoCidadeCount || 0,
            liberado: liberadoCidadeCount || 0,
          });
        }

        atendentesDataArray.push({
          nome: atendente,
          enviado,
          liberado,
          fotoUrl: ATENDENTES_FOTOS[atendente] || null,
          cidades: cidadesData,
        });
      }

      setAtendentesData(atendentesDataArray);
      setTotais({
        totalEnviado,
        totalLiberado,
      });
    } catch (err: any) {
      safeLog.error('Erro ao buscar dados dos atendentes:', err);
      throw err;
    }
  };

  // Buscar dados quando os filtros mudarem
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        await fetchAtendentesData();
      } catch (err: any) {
        safeLog.error('Erro ao buscar dados de Resultados:', err);
        setError(err.message || 'Erro ao carregar dados de Resultados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.filtroLiberacao, filters.filtroEnviados]);

  const handleFilterChange = (filterName: 'filtroLiberacao' | 'filtroEnviados', filter: MarketingDateFilter) => {
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
          <p className="mt-4 text-lg font-semibold text-purple-700 dark:text-purple-200">Carregando resultados...</p>
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
      {/* Cartão de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarketingCard
          title="Total Enviado"
          value={totais.totalEnviado}
          icon="📤"
          color="green"
        />
        <MarketingCard
          title="Total Liberado"
          value={totais.totalLiberado}
          icon="✅"
          color="purple"
        />
      </div>

      {/* Filtros de Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Lista de Atendentes */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Resultados por Atendente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {atendentesData.map((atendenteData) => (
            <div key={atendenteData.nome} className="space-y-4">
              <AtendenteCard
                nome={atendenteData.nome}
                enviado={atendenteData.enviado}
                liberado={atendenteData.liberado}
                fotoUrl={atendenteData.fotoUrl}
              />
              
              {/* Métricas por Cidade */}
              {atendenteData.cidades && atendenteData.cidades.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Por Cidade
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {atendenteData.cidades
                      .filter(c => c.enviado > 0 || c.liberado > 0)
                      .map((cidadeData) => (
                        <div
                          key={`${atendenteData.nome}-${cidadeData.cidade}`}
                          className="group rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-300 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900/50 dark:hover:border-purple-500"
                        >
                          <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5 truncate" title={cidadeData.cidade}>
                            {cidadeData.cidade}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 rounded-md bg-emerald-50/80 px-2 py-1.5 dark:bg-emerald-950/30">
                              <svg className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Enviado</p>
                                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100 font-mono">{cidadeData.enviado.toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-md bg-blue-50/80 px-2 py-1.5 dark:bg-blue-950/30">
                              <svg className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Liberado</p>
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-100 font-mono">{cidadeData.liberado.toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ResultadosView.displayName = 'ResultadosView';

export default ResultadosView;

