import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MarketingFilters, MarketingTotals, MarketingCityData, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { getCurrentUserOrganizationId } from '@/utils/organizationHelpers';
import { CIDADES } from '@/constants/marketing';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useMarketingData() {
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
        filtroDataInicio: { dataInicial: null, dataFinal: null },
    });

    const fetchTotals = useCallback(async () => {
        try {
            // Se não houver filtro, não definir padrão (null = todo o período)
            // Isso permite ver o total geral quando nenhum filtro está aplicado
            const defaultStart = null;
            const defaultEnd = null;

            // Obter organization_id do usuário atual
            const organizationId = await getCurrentUserOrganizationId();

            // Tentar usar RPC primeiro
            // Se tiver filtro específico, usa ele. Se não, usa o default (mês atual) para todos os campos de data
            // Isso garante que a dashboard sempre mostre algo relevante
            const { data: rpcData, error: rpcError } = await safeRpc<Array<{
                criado: number;
                enviado: number;
                liberado: number;
                rodando_inicio: number;
            }>>('get_marketing_totals', {
                data_envio_inicial: filters.filtroEnviados.dataInicial || defaultStart,
                data_envio_final: filters.filtroEnviados.dataFinal || defaultEnd,
                data_liberacao_inicial: filters.filtroLiberacao.dataInicial || defaultStart,
                data_liberacao_final: filters.filtroLiberacao.dataFinal || defaultEnd,
                rodou_dia_inicial: filters.filtroRodouDia.dataInicial || defaultStart,
                rodou_dia_final: filters.filtroRodouDia.dataFinal || defaultEnd,
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
            
            // Aplicar filtro ou default
            if (filters.filtroEnviados.dataInicial) {
                 enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
            } else if (defaultStart && defaultEnd) {
                 enviadoQuery = enviadoQuery.gte('data_envio', defaultStart).lte('data_envio', defaultEnd);
            }
            const { count: enviadoCount } = await enviadoQuery;

            let liberadoQuery = supabase
                .from('dados_marketing')
                .select('*', { count: 'exact', head: true });
            
            if (filters.filtroLiberacao.dataInicial) {
                liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
            } else if (defaultStart && defaultEnd) {
                liberadoQuery = liberadoQuery.gte('data_liberacao', defaultStart).lte('data_liberacao', defaultEnd);
            }
            const { count: liberadoCount } = await liberadoQuery;

            let rodandoQuery = supabase
                .from('dados_marketing')
                .select('*', { count: 'exact', head: true });
            
            if (filters.filtroRodouDia.dataInicial) {
                rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);
            } else if (defaultStart && defaultEnd) {
                rodandoQuery = rodandoQuery.gte('rodou_dia', defaultStart).lte('rodou_dia', defaultEnd);
            }
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
    }, [filters]);

    const fetchCitiesData = useCallback(async () => {
        try {
            // Se não houver filtro, não definir padrão (null = todo o período)
            // Isso permite ver o total geral quando nenhum filtro está aplicado
            const defaultStart = null;
            const defaultEnd = null;

            // Obter organization_id do usuário atual
            const organizationId = await getCurrentUserOrganizationId();

            // Tentar usar RPC primeiro
            const { data: rpcData, error: rpcError } = await safeRpc<Array<{
                cidade: string;
                enviado: number;
                liberado: number;
                rodando_inicio: number;
            }>>('get_marketing_cities_data', {
                data_envio_inicial: filters.filtroEnviados.dataInicial || defaultStart,
                data_envio_final: filters.filtroEnviados.dataFinal || defaultEnd,
                data_liberacao_inicial: filters.filtroLiberacao.dataInicial || defaultStart,
                data_liberacao_final: filters.filtroLiberacao.dataFinal || defaultEnd,
                rodou_dia_inicial: filters.filtroRodouDia.dataInicial || defaultStart,
                rodou_dia_final: filters.filtroRodouDia.dataFinal || defaultEnd,
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
                
                if (filters.filtroEnviados.dataInicial) {
                    enviadoQuery = buildDateFilterQuery(enviadoQuery, 'data_envio', filters.filtroEnviados);
                } else if (defaultStart && defaultEnd) {
                    enviadoQuery = enviadoQuery.gte('data_envio', defaultStart).lte('data_envio', defaultEnd);
                }
                const { count: enviadoCount } = await enviadoQuery;

                let liberadoQuery = supabase
                    .from('dados_marketing')
                    .select('*', { count: 'exact', head: true });
                liberadoQuery = buildCityQuery(liberadoQuery, cidade);
                
                if (filters.filtroLiberacao.dataInicial) {
                    liberadoQuery = buildDateFilterQuery(liberadoQuery, 'data_liberacao', filters.filtroLiberacao);
                } else if (defaultStart && defaultEnd) {
                    liberadoQuery = liberadoQuery.gte('data_liberacao', defaultStart).lte('data_liberacao', defaultEnd);
                }
                const { count: liberadoCount } = await liberadoQuery;

                let rodandoQuery = supabase
                    .from('dados_marketing')
                    .select('*', { count: 'exact', head: true });
                rodandoQuery = buildCityQuery(rodandoQuery, cidade);
                
                if (filters.filtroRodouDia.dataInicial) {
                    rodandoQuery = buildDateFilterQuery(rodandoQuery, 'rodou_dia', filters.filtroRodouDia);
                } else if (defaultStart && defaultEnd) {
                    rodandoQuery = rodandoQuery.gte('rodou_dia', defaultStart).lte('rodou_dia', defaultEnd);
                }
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
    }, [filters]);

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
    }, [fetchTotals, fetchCitiesData]);

    const handleFilterChange = (filterName: keyof MarketingFilters, filter: MarketingDateFilter) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: filter,
        }));
    };

    return {
        loading,
        error,
        totals,
        citiesData,
        filters,
        handleFilterChange
    };
}
