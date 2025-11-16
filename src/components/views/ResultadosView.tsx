'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MarketingFilters, MarketingDateFilter, AtendenteCidadeData } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import MarketingDateFilterComponent from '@/components/MarketingDateFilter';
import MarketingCard from '@/components/MarketingCard';
import AtendenteCard from '@/components/AtendenteCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MapPin, Send, CheckCircle2 } from 'lucide-react';

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
      // Tentar usar RPC primeiro
      const { data: rpcData, error: rpcError } = await safeRpc<Array<{
        responsavel: string;
        enviado: number;
        liberado: number;
        cidade: string;
        cidade_enviado: number;
        cidade_liberado: number;
      }>>('get_marketing_atendentes_data', {
        data_envio_inicial: filters.filtroEnviados.dataInicial || null,
        data_envio_final: filters.filtroEnviados.dataFinal || null,
        data_liberacao_inicial: filters.filtroLiberacao.dataInicial || null,
        data_liberacao_final: filters.filtroLiberacao.dataFinal || null,
      });

      if (!rpcError && rpcData) {
        // Agrupar dados por atendente
        const atendentesMap = new Map<string, AtendenteData>();
        let totalEnviado = 0;
        let totalLiberado = 0;

        // Primeiro, calcular totais por atendente (somar todas as cidades)
        const atendentesTotals = new Map<string, { enviado: number; liberado: number }>();
        
        for (const item of rpcData) {
          if (!atendentesTotals.has(item.responsavel)) {
            atendentesTotals.set(item.responsavel, { enviado: 0, liberado: 0 });
          }
          const totals = atendentesTotals.get(item.responsavel)!;
          totals.enviado += item.cidade_enviado || 0;
          totals.liberado += item.cidade_liberado || 0;
        }

        // Agora criar estrutura de dados
        for (const item of rpcData) {
          if (!atendentesMap.has(item.responsavel)) {
            const totals = atendentesTotals.get(item.responsavel)!;
            atendentesMap.set(item.responsavel, {
              nome: item.responsavel,
              enviado: totals.enviado,
              liberado: totals.liberado,
              fotoUrl: ATENDENTES_FOTOS[item.responsavel] || null,
              cidades: [],
            });
            totalEnviado += totals.enviado;
            totalLiberado += totals.liberado;
          }

          const atendenteData = atendentesMap.get(item.responsavel)!;
          
          // Adicionar dados da cidade
          if (item.cidade) {
            atendenteData.cidades!.push({
              atendente: item.responsavel,
              cidade: item.cidade,
              enviado: item.cidade_enviado || 0,
              liberado: item.cidade_liberado || 0,
            });
          }
        }

        // Garantir que todos os atendentes estejam presentes
        const atendentesDataArray: AtendenteData[] = ATENDENTES.map(atendente => {
          const data = atendentesMap.get(atendente);
          if (data) {
            return data;
          }
          // Se não encontrado no RPC, criar entrada vazia
          return {
            nome: atendente,
            enviado: 0,
            liberado: 0,
            fotoUrl: ATENDENTES_FOTOS[atendente] || null,
            cidades: CIDADES.map(cidade => ({
              atendente,
              cidade,
              enviado: 0,
              liberado: 0,
            })),
          };
        });

        setAtendentesData(atendentesDataArray);
        setTotais({
          totalEnviado,
          totalLiberado,
        });
        return;
      }

      // Fallback para queries diretas
      if (IS_DEV) {
        safeLog.warn('RPC get_marketing_atendentes_data não disponível, usando fallback');
      }

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
                <Card className="border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-300/50 dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      Por Cidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={`cidades-${atendenteData.nome}`} className="border-none">
                        <AccordionTrigger className="py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:no-underline">
                          Ver cidades ({atendenteData.cidades.filter(c => c.enviado > 0 || c.liberado > 0).length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {atendenteData.cidades
                              .filter(c => c.enviado > 0 || c.liberado > 0)
                              .map((cidadeData) => (
                                <Card
                                  key={`${atendenteData.nome}-${cidadeData.cidade}`}
                                  className="group border-slate-200/50 bg-white/80 p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-300/50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-purple-500/50"
                                >
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5 truncate" title={cidadeData.cidade}>
                                    {cidadeData.cidade}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800"
                                    >
                                      <Send className="h-3 w-3 mr-1" />
                                      <span className="text-[10px] font-medium mr-1">Enviado:</span>
                                      <span className="text-xs font-bold font-mono">{cidadeData.enviado.toLocaleString('pt-BR')}</span>
                                    </Badge>
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-blue-50 text-blue-900 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-100 border-blue-200 dark:border-blue-800"
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      <span className="text-[10px] font-medium mr-1">Liberado:</span>
                                      <span className="text-xs font-bold font-mono">{cidadeData.liberado.toLocaleString('pt-BR')}</span>
                                    </Badge>
                                  </div>
                                </Card>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
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

