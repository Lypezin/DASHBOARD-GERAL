import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadoresMV(
    filtroRodouDia: MarketingDateFilter,
    cidadeSelecionada: string,
    searchTerm: string
): Promise<EntregadorMarketing[] | null> {
    try {
        let mvQuery = supabase
            .from('mv_entregadores_marketing')
            .select('*');

        // Aplicar filtros na MV
        if (cidadeSelecionada) {
            if (cidadeSelecionada === 'Santo André') {
                mvQuery = mvQuery.eq('regiao_atuacao', 'ABC 2.0');
            } else if (cidadeSelecionada === 'São Bernardo') {
                mvQuery = mvQuery.eq('regiao_atuacao', 'ABC 2.0');
            } else {
                mvQuery = mvQuery.eq('regiao_atuacao', cidadeSelecionada);
            }
        }

        if (searchTerm) {
            mvQuery = mvQuery.or(`nome.ilike.%${searchTerm}%,id_entregador.eq.${searchTerm}`);
        }

        if (filtroRodouDia.dataInicial) {
            mvQuery = mvQuery.gte('ultima_data', filtroRodouDia.dataInicial);
        }
        if (filtroRodouDia.dataFinal) {
            mvQuery = mvQuery.lte('ultima_data', filtroRodouDia.dataFinal);
        }

        const { data: mvData, error: mvError } = await mvQuery;

        if (!mvError && mvData && mvData.length > 0) {
            // Sucesso na MV! Agora precisamos enriquecer com 'rodando' e refinar cidade (ABC)
            const ids = mvData.map((d: any) => d.id_entregador);

            const { data: mktData } = await supabase
                .from('dados_marketing')
                .select('id_entregador, rodando, sub_praca_abc')
                .in('id_entregador', ids);

            const mktMap = new Map(mktData?.map((d: any) => [d.id_entregador, d]) || []);

            const entregadoresMV: EntregadorMarketing[] = [];

            for (const row of mvData) {
                const mktInfo = mktMap.get(row.id_entregador);

                // Refinar filtro de cidade ABC
                if (cidadeSelecionada === 'Santo André') {
                    if (!['Vila Aquino', 'São Caetano'].includes(mktInfo?.sub_praca_abc)) continue;
                } else if (cidadeSelecionada === 'São Bernardo') {
                    if (!['Diadema', 'Nova petrópolis', 'Rudge Ramos'].includes(mktInfo?.sub_praca_abc)) continue;
                }

                entregadoresMV.push({
                    id_entregador: row.id_entregador,
                    nome: row.nome || 'Nome não informado',
                    total_ofertadas: row.total_ofertadas || 0,
                    total_aceitas: row.total_aceitas || 0,
                    total_completadas: row.total_completadas || 0,
                    total_rejeitadas: row.total_rejeitadas || 0,
                    total_segundos: row.total_segundos || 0,
                    ultima_data: row.ultima_data,
                    dias_sem_rodar: row.dias_sem_rodar,
                    regiao_atuacao: row.regiao_atuacao,
                    rodando: mktInfo?.rodando || null
                });
            }

            if (IS_DEV) safeLog.info(`✅ ${entregadoresMV.length} entregador(es) via Materialized View (Instantâneo)`);

            // Ordenar
            entregadoresMV.sort((a, b) => a.nome.localeCompare(b.nome));
            return entregadoresMV;
        }
        return null;
    } catch (e) {
        safeLog.warn('Falha ao usar MV, usando fallback lento:', e);
        return null;
    }
}
