import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { RPC_TIMEOUTS } from '@/constants/config';
import { safeLog } from '@/lib/errorHandler';
import { CITY_DB_MAPPING } from '@/constants/marketing';

interface FluxoEntregadores {
    semana: string;
    entradas: number;
    saidas: number;
    entradas_total: number;
    entradas_marketing: number;
    saidas_novos: number;
    nomes_entradas: string[];
    nomes_saidas: string[];
    nomes_saidas_novos: string[];
    nomes_entradas_marketing: string[];
    nomes_saidas_marketing: string[];
    nomes_saidas_novos_marketing: string[];
    nomes_entradas_operacional: string[];
    nomes_saidas_operacional: string[];
    nomes_saidas_novos_operacional: string[];
}

interface UseEntradaSaidaDataProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export function useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca }: UseEntradaSaidaDataProps) {
    const [data, setData] = useState<FluxoEntregadores[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!organizationId) {
                return;
            }

            // Se não houver datas, usar o ano atual como padrão
            let start = dataInicial;
            let end = dataFinal;

            if (!start || !end) {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), 0, 1);
                start = firstDay.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            }

            setLoading(true);
            setError(null);

            // Mapear nome da praça para o valor do banco
            const dbPraca = praca ? CITY_DB_MAPPING[praca] || praca : null;

            try {
                // Fetch Marketing Couriers List to cross-reference
                const { data: marketingData, error: marketingError } = await supabase
                    .from('dados_marketing')
                    .select('nome, id_entregador')
                    .eq('organization_id', organizationId);

                let marketingCourierNames = new Set<string>();

                if (!marketingError && marketingData) {
                    marketingData.forEach((m: any) => {
                        if (m.nome) marketingCourierNames.add(m.nome.toLowerCase().trim());
                    });
                }

                const { data: rpcData, error: rpcError } = await safeRpc<FluxoEntregadores[]>('get_fluxo_semanal', {
                    p_data_inicial: start,
                    p_data_final: end,
                    p_organization_id: organizationId,
                    p_praca: dbPraca
                }, {
                    timeout: RPC_TIMEOUTS.LONG,
                    validateParams: true
                });

                if (rpcError) throw rpcError;

                const rawData = Array.isArray(rpcData) ? rpcData : (rpcData || []);

                const isMarketingCourier = (name: string, marketingSet: Set<string>) => {
                    if (!name) return false;
                    const normalized = name.toLowerCase().trim();
                    if (marketingSet.has(normalized)) return true;
                    for (const mName of marketingSet) {
                        if (normalized.includes(mName) || mName.includes(normalized)) return true;
                    }
                    return false;
                };

                const processedData = rawData.map(item => {
                    const entradasNames = item.nomes_entradas || [];
                    const saidasNames = item.nomes_saidas || [];
                    const saidasNovosNames = item.nomes_saidas_novos || [];

                    const marketingEntradas = entradasNames.filter(name => isMarketingCourier(name, marketingCourierNames));
                    const marketingSaidas = saidasNames.filter(name => isMarketingCourier(name, marketingCourierNames));
                    const marketingSaidasNovos = saidasNovosNames.filter(name => isMarketingCourier(name, marketingCourierNames));

                    const operacionalEntradas = entradasNames.filter(name => !isMarketingCourier(name, marketingCourierNames));
                    const operacionalSaidas = saidasNames.filter(name => !isMarketingCourier(name, marketingCourierNames));
                    const operacionalSaidasNovos = saidasNovosNames.filter(name => !isMarketingCourier(name, marketingCourierNames));

                    return {
                        ...item,
                        entradas_total: item.entradas,
                        saidas_total: item.saidas,
                        saidas_novos: item.saidas_novos || 0,

                        entradas_marketing: marketingEntradas.length,
                        saidas_marketing: marketingSaidas.length,

                        nomes_entradas_marketing: marketingEntradas,
                        nomes_saidas_marketing: marketingSaidas,
                        nomes_saidas_novos_marketing: marketingSaidasNovos,

                        nomes_entradas_operacional: operacionalEntradas,
                        nomes_saidas_operacional: operacionalSaidas,
                        nomes_saidas_novos_operacional: operacionalSaidasNovos,

                        // Legacy
                        entradas: item.entradas,
                        saidas: item.saidas
                    };
                });

                setData(processedData);
            } catch (err: any) {
                safeLog.error('Erro ao buscar fluxo de entregadores:', err);
                setError(err.message || 'Erro ao carregar dados.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [dataInicial, dataFinal, organizationId, praca]);

    return { data, loading, error };
}
