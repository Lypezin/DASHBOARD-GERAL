'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { ResultadosFilters } from './resultados/ResultadosFilters';
import { ResultadosCards } from './resultados/ResultadosCards';
import { AtendenteData } from './resultados/AtendenteCard';
import { AtendenteCidadeData } from '@/types';
import { CIDADES, SANTO_ANDRE_SUB_PRACAS, SAO_BERNARDO_SUB_PRACAS } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

// Lista de atendentes
const ATENDENTES = [
  'Fernanda Raphaelly',
  'Beatriz Angelo',
  'Melissa',
  'Carolini Braguini',
];

// Mapeamento de fotos dos atendentes
const ATENDENTES_FOTOS: { [key: string]: string | null } = {
  'Fernanda Raphaelly': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/FERNANDA%20FOTO.png',
  'Beatriz Angelo': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/FOTO%20BEATRIZ.png',
  'Melissa': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/MELISSA%20FOTO.png',
  'Carolini Braguini': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/CAROL%20FOTO.jpg',
};

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
    filtroEnviadosLiberados: MarketingDateFilter;
  }>({
    filtroLiberacao: { dataInicial: null, dataFinal: null },
    filtroEnviados: { dataInicial: null, dataFinal: null },
    filtroEnviadosLiberados: { dataInicial: null, dataFinal: null },
  });

  // Função para buscar custo por liberado por atendente e por cidade
  const fetchCustoPorLiberado = async (atendentesDataAtual: AtendenteData[]) => {
    try {
      // Mapeamento reverso: nome do atendente -> ID
      const atendenteToId: { [key: string]: string } = {
        'Carolini Braguini': '6905',
        'Melissa': '4182',
        'Beatriz Angelo': '6976',
        'Fernanda Raphaelly': '5447',
      };

      // Buscar valores por cidade e por atendente usando o filtro de Enviados Liberados
      let valoresQuery = supabase
        .from('dados_valores_cidade')
        .select('id_atendente, cidade, valor');

      // Aplicar filtro de data se houver
      if (filters.filtroEnviadosLiberados.dataInicial) {
        valoresQuery = valoresQuery.gte('data', filters.filtroEnviadosLiberados.dataInicial);
      }
      if (filters.filtroEnviadosLiberados.dataFinal) {
        valoresQuery = valoresQuery.lte('data', filters.filtroEnviadosLiberados.dataFinal);
      }
      
      // Se não há filtro, ainda buscar valores (não aplicar not null aqui para não limitar demais)

      const { data: valoresData, error: valoresError } = await valoresQuery;

      // Agrupar valores por atendente e cidade: Map<atendenteNome, Map<cidade, valor>>
      const valoresPorAtendenteECidade = new Map<string, Map<string, number>>();
      if (!valoresError && valoresData) {
        valoresData.forEach((row: any) => {
          // Normalizar ID do atendente (pode vir como string ou número)
          const idAtendenteRaw = row.id_atendente;
          const idAtendente = idAtendenteRaw != null ? String(idAtendenteRaw).trim() : '';
          const cidade = String(row.cidade || 'Não especificada').trim();
          const valor = Number(row.valor) || 0;
          
          // Encontrar o nome do atendente pelo ID (comparar normalizado)
          let atendenteNome = '';
          for (const [nome, id] of Object.entries(atendenteToId)) {
            const idNormalizado = String(id).trim();
            if (idNormalizado === idAtendente) {
              atendenteNome = nome;
              break;
            }
          }
          
          if (atendenteNome) {
            if (!valoresPorAtendenteECidade.has(atendenteNome)) {
              valoresPorAtendenteECidade.set(atendenteNome, new Map<string, number>());
            }
            const cidadeMap = valoresPorAtendenteECidade.get(atendenteNome)!;
            if (cidadeMap.has(cidade)) {
              cidadeMap.set(cidade, cidadeMap.get(cidade)! + valor);
            } else {
              cidadeMap.set(cidade, valor);
            }
          }
        });
      }
      
      // Debug: verificar se encontrou valores para Fernanda
      if (IS_DEV) {
        const valoresFernanda = valoresPorAtendenteECidade.get('Fernanda Raphaelly');
        safeLog.info('Valores encontrados para Fernanda Raphaelly:', {
          encontrou: !!valoresFernanda,
          valores: valoresFernanda ? Array.from(valoresFernanda.entries()) : [],
          totalValores: valoresData?.length || 0,
        });
      }

      // Mapear nome da cidade para regiao_atuacao
      const cidadeToRegiao: { [key: string]: string } = {
        'SÃO PAULO': 'São Paulo 2.0',
        'MANAUS': 'Manaus 2.0',
        'ABC': 'ABC 2.0',
        'SOROCABA': 'Sorocaba 2.0',
        'GUARULHOS': 'Guarulhos 2.0',
        'SALVADOR': 'Salvador 2.0',
        'TABOÃO DA SERRA E EMBU DAS ARTES': 'Taboão da Serra e Embu das Artes 2.0',
      };

      // Calcular custo por liberado por atendente e por cidade
      const atendentesComCusto = await Promise.all(
        atendentesDataAtual.map(async (atendente) => {
          // Buscar liberados deste atendente (com filtro de Enviados Liberados e status = 'Liberado')
          let liberadosQuery = supabase
            .from('dados_marketing')
            .select('*', { count: 'exact', head: true });

          liberadosQuery = buildDateFilterQuery(liberadosQuery, 'data_envio', filters.filtroEnviadosLiberados);
          liberadosQuery = liberadosQuery.eq('status', 'Liberado');
          liberadosQuery = liberadosQuery.eq('responsavel', atendente.nome);

          const { count: liberadosCount } = await liberadosQuery;
          const quantidadeLiberados = liberadosCount || 0;

          // Buscar valor total deste atendente (somar valores de todas as cidades que ele trabalha)
          let valorTotalAtendente = 0;
          
          // Criar mapeamento reverso: regiao_atuacao -> nome da cidade em dados_valores_cidade
          const regiaoToCidadeValores: { [key: string]: string } = {
            'São Paulo 2.0': 'SÃO PAULO',
            'Manaus 2.0': 'MANAUS',
            'ABC 2.0': 'ABC',
            'Sorocaba 2.0': 'SOROCABA',
            'Guarulhos 2.0': 'GUARULHOS',
            'Salvador 2.0': 'SALVADOR',
            'Taboão da Serra e Embu das Artes 2.0': 'TABOÃO DA SERRA E EMBU DAS ARTES',
          };

          // Buscar valores deste atendente
          const valoresAtendente = valoresPorAtendenteECidade.get(atendente.nome) || new Map<string, number>();

          // Calcular custo por liberado por cidade para este atendente
          const cidadesComCustoAtendente = await Promise.all(
            (atendente.cidades || []).map(async (cidadeData) => {
              // Mapear nome da cidade para o formato usado em dados_valores_cidade
              const cidadeUpper = cidadeData.cidade.toUpperCase().trim();
              const cidadeNormalizada = cidadeData.cidade.trim();
              
              // Tentar encontrar o valor usando o nome da cidade diretamente
              let valorCidade = valoresAtendente.get(cidadeNormalizada) || 0;
              
              // Se não encontrou, tentar mapear
              if (valorCidade === 0) {
                // Se for uma cidade do ABC, tentar buscar por "ABC"
                if (cidadeData.cidade === 'Santo André' || cidadeData.cidade === 'São Bernardo' || cidadeData.cidade === 'ABC 2.0') {
                  valorCidade = valoresAtendente.get('ABC') || 0;
                  // Também tentar variações
                  if (valorCidade === 0) {
                    valorCidade = valoresAtendente.get('ABC 2.0') || 0;
                  }
                } else {
                  // Tentar buscar pelo nome em maiúsculas ou pelo mapeamento
                  const regiaoMapeada = regiaoToCidadeValores[cidadeData.cidade] || cidadeUpper;
                  valorCidade = valoresAtendente.get(regiaoMapeada) || 
                                valoresAtendente.get(cidadeUpper) || 
                                valoresAtendente.get(cidadeNormalizada) || 
                                valoresAtendente.get(cidadeData.cidade) || 0;
                  
                  // Se ainda não encontrou, tentar todas as variações possíveis
                  if (valorCidade === 0) {
                    for (const [cidadeKey, valor] of valoresAtendente.entries()) {
                      if (cidadeKey.toUpperCase().trim() === cidadeUpper || 
                          cidadeKey.trim() === cidadeNormalizada ||
                          cidadeKey.toUpperCase().trim() === regiaoMapeada.toUpperCase().trim()) {
                        valorCidade = valor;
                        break;
                      }
                    }
                  }
                }
              }

              // Buscar quantidade de liberados para esta cidade e este atendente
              let liberadosCidadeQuery = supabase
                .from('dados_marketing')
                .select('*', { count: 'exact', head: true });

              liberadosCidadeQuery = buildDateFilterQuery(liberadosCidadeQuery, 'data_envio', filters.filtroEnviadosLiberados);
              liberadosCidadeQuery = liberadosCidadeQuery.eq('status', 'Liberado');
              liberadosCidadeQuery = liberadosCidadeQuery.eq('responsavel', atendente.nome);

              // Mapear cidade para regiao_atuacao
              if (cidadeData.cidade === 'ABC' || cidadeData.cidade === 'ABC 2.0') {
                liberadosCidadeQuery = liberadosCidadeQuery.eq('regiao_atuacao', 'ABC 2.0');
              } else if (cidadeData.cidade === 'Santo André') {
                liberadosCidadeQuery = liberadosCidadeQuery
                  .eq('regiao_atuacao', 'ABC 2.0')
                  .in('sub_praca_abc', SANTO_ANDRE_SUB_PRACAS);
              } else if (cidadeData.cidade === 'São Bernardo') {
                liberadosCidadeQuery = liberadosCidadeQuery
                  .eq('regiao_atuacao', 'ABC 2.0')
                  .in('sub_praca_abc', SAO_BERNARDO_SUB_PRACAS);
              } else {
                liberadosCidadeQuery = liberadosCidadeQuery.eq('regiao_atuacao', cidadeData.cidade);
              }

              const { count: liberadosCidadeCount } = await liberadosCidadeQuery;
              const quantidadeLiberadosCidade = liberadosCidadeCount || 0;

              // Calcular custo por liberado para esta cidade
              let custoPorLiberadoCidade = 0;
              if (quantidadeLiberadosCidade > 0 && valorCidade > 0) {
                custoPorLiberadoCidade = valorCidade / quantidadeLiberadosCidade;
              }

              valorTotalAtendente += valorCidade;

              return {
                ...cidadeData,
                custoPorLiberado: custoPorLiberadoCidade > 0 ? custoPorLiberadoCidade : undefined,
                quantidadeLiberados: quantidadeLiberadosCidade,
                valorTotal: valorCidade,
              };
            })
          );

          // Calcular custo por liberado total do atendente
          let custoPorLiberado = 0;
          if (quantidadeLiberados > 0 && valorTotalAtendente > 0) {
            custoPorLiberado = valorTotalAtendente / quantidadeLiberados;
          }

          // Debug para Fernanda Raphaelly
          if (IS_DEV && atendente.nome === 'Fernanda Raphaelly') {
            safeLog.info('Fernanda Raphaelly - Debug:', {
              quantidadeLiberados,
              valorTotalAtendente,
              custoPorLiberado,
              valoresAtendente: Array.from(valoresAtendente.entries()),
              cidadesComCusto: cidadesComCustoAtendente.map(c => ({
                cidade: c.cidade,
                valorTotal: c.valorTotal,
                quantidadeLiberados: c.quantidadeLiberados,
                custoPorLiberado: c.custoPorLiberado,
              })),
            });
          }

          return {
            ...atendente,
            custoPorLiberado: custoPorLiberado > 0 ? custoPorLiberado : undefined,
            quantidadeLiberados: quantidadeLiberados,
            valorTotal: valorTotalAtendente,
            cidades: cidadesComCustoAtendente,
          };
        })
      );

      setAtendentesData(atendentesComCusto);
    } catch (err: any) {
      safeLog.error('Erro ao buscar custo por liberado:', err);
      // Não lançar erro, apenas logar
    }
  };

  // Função para buscar dados dos atendentes
  const fetchAtendentesData = async (): Promise<AtendenteData[]> => {
    try {
      // Tentar usar RPC primeiro
      // Sempre passar todos os parâmetros (null quando não há filtro)
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
      }, { validateParams: false });

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        // Agrupar dados por atendente
        const atendentesMap = new Map<string, AtendenteData>();
        let totalEnviado = 0;
        let totalLiberado = 0;

        // Processar dados RPC
        for (const item of rpcData) {
          if (!atendentesMap.has(item.responsavel)) {
            // Primeira vez que vemos este atendente - usar totais da função RPC
            atendentesMap.set(item.responsavel, {
              nome: item.responsavel,
              enviado: item.enviado || 0,
              liberado: item.liberado || 0,
              fotoUrl: ATENDENTES_FOTOS[item.responsavel] || null,
              cidades: [],
            });
            totalEnviado += item.enviado || 0;
            totalLiberado += item.liberado || 0;
          }

          const atendenteData = atendentesMap.get(item.responsavel)!;
          
          // Adicionar dados da cidade (apenas se cidade_enviado ou cidade_liberado > 0)
          if (item.cidade && (item.cidade_enviado > 0 || item.cidade_liberado > 0)) {
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
        return atendentesDataArray;
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
      return atendentesDataArray;
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
        const atendentesDataResult = await fetchAtendentesData();
        // Buscar custo por liberado após buscar dados dos atendentes
        if (atendentesDataResult && atendentesDataResult.length > 0) {
          await fetchCustoPorLiberado(atendentesDataResult);
        }
      } catch (err: any) {
        safeLog.error('Erro ao buscar dados de Resultados:', err);
        setError(err.message || 'Erro ao carregar dados de Resultados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // fetchData usa filters completo, mas só queremos re-executar quando estes filtros específicos mudarem
  }, [filters.filtroLiberacao, filters.filtroEnviados, filters.filtroEnviadosLiberados]);

  const handleFilterChange = (filterName: 'filtroLiberacao' | 'filtroEnviados' | 'filtroEnviadosLiberados', filter: MarketingDateFilter) => {
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
    <div className="space-y-4">
      {/* Header com Totais e Filtros */}
      <div className="space-y-4">
        <ResultadosCards
          totalEnviado={totais.totalEnviado}
          totalLiberado={totais.totalLiberado}
          atendentesData={atendentesData}
        />
      </div>

      <ResultadosFilters
        filtroLiberacao={filters.filtroLiberacao}
        filtroEnviados={filters.filtroEnviados}
        filtroEnviadosLiberados={filters.filtroEnviadosLiberados}
        onFiltroLiberacaoChange={(filter) => handleFilterChange('filtroLiberacao', filter)}
        onFiltroEnviadosChange={(filter) => handleFilterChange('filtroEnviados', filter)}
        onFiltroEnviadosLiberadosChange={(filter) => handleFilterChange('filtroEnviadosLiberados', filter)}
      />
    </div>
  );
});

ResultadosView.displayName = 'ResultadosView';

export default ResultadosView;

