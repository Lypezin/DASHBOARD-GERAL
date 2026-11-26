import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { MarketingDateFilter } from '@/types';
import { ATENDENTE_TO_ID } from '@/utils/atendenteMappers';
import { ensureMarketingDateFilter } from '@/utils/marketingQueries';
import { IS_DEV } from '@/constants/environment';

const ID_TO_ATENDENTE_NOME = (() => {
    const map = new Map<string, string>();
    for (const [nome, ids] of Object.entries(ATENDENTE_TO_ID)) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        for (const id of idArray) {
            const normalized = String(id).trim();
            if (normalized) map.set(normalized, nome);
        }
    }
    return map;
})();


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

            const atendenteNome = idAtendente ? ID_TO_ATENDENTE_NOME.get(idAtendente) || '' : '';

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
