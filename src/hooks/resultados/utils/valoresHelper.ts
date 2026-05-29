import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { MarketingDateFilter } from '@/types';
import { ATENDENTE_TO_ID } from '@/utils/atendenteMappers';
import { ensureMarketingDateFilter } from '@/utils/marketingQueries';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchAndProcessValores(filtroEnviadosLiberados: MarketingDateFilter) {
    const safeFilter = ensureMarketingDateFilter(filtroEnviadosLiberados);

    let valoresQuery = supabase
        .from('dados_valores_cidade')
        .select('id_atendente, cidade, valor');

    if (safeFilter.dataInicial) {
        valoresQuery = valoresQuery.gte('data', safeFilter.dataInicial);
    }
    if (safeFilter.dataFinal) {
        valoresQuery = valoresQuery.lte('data', safeFilter.dataFinal);
    }

    const { data: valoresData, error: valoresError } = await valoresQuery;

    const valoresPorAtendenteECidade = new Map<string, Map<string, number>>();

    if (!valoresError && valoresData) {
        valoresData.forEach((row: any) => {
            const idAtendenteRaw = row.id_atendente;
            const idAtendente = idAtendenteRaw != null ? String(idAtendenteRaw).trim() : '';
            const cidade = String(row.cidade || 'Não especificada').trim();
            const valor = Number(row.valor) || 0;

            let atendenteNome = '';
            for (const [nome, ids] of Object.entries(ATENDENTE_TO_ID)) {
                // Suporta tanto string única quanto array de IDs
                const idArray = Array.isArray(ids) ? ids : [ids];
                if (idArray.some(id => String(id).trim() === idAtendente)) {
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

    if (IS_DEV) {
        const valoresFernanda = valoresPorAtendenteECidade.get('Fernanda Raphaelly');
        safeLog.info('Valores encontrados para Fernanda Raphaelly:', {
            encontrou: !!valoresFernanda,
            valores: valoresFernanda ? Array.from(valoresFernanda.entries()) : [],
            totalValores: valoresData?.length || 0,
        });
    }

    return valoresPorAtendenteECidade;
}
