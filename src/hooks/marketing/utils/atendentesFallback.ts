
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { MarketingDateFilter, AtendenteCidadeData } from '@/types';
import { AtendenteData } from '@/components/views/resultados/AtendenteCard';
import { CIDADES } from '@/constants/marketing';
import { ATENDENTES, ATENDENTES_FOTOS } from '@/utils/atendenteMappers';
import { buildDateFilterQuery, buildCityQuery } from '@/utils/marketingQueries';

export const fetchFallbackData = async (
    filters: {
        filtroLiberacao: MarketingDateFilter;
        filtroEnviados: MarketingDateFilter;
    }
): Promise<{ atendentes: AtendenteData[]; totais: { totalEnviado: number; totalLiberado: number } }> => {
    if (process.env.NODE_ENV === 'development') {
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

    return {
        atendentes: atendentesDataArray,
        totais: { totalEnviado, totalLiberado },
    };
};
