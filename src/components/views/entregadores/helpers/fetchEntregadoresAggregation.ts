import { supabase } from '@/lib/supabaseClient';
import { EntregadorMarketing, MarketingDateFilter } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { QUERY_LIMITS } from '@/constants/config';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchEntregadoresAggregation(
    filtroDataInicio: MarketingDateFilter,
    filtroRodouDia: MarketingDateFilter,
    cidadeSelecionada: string,
    searchTerm: string
): Promise<EntregadorMarketing[]> {
    // OTIMIZAÇÃO: Filtrar dados_marketing PRIMEIRO para reduzir o dataset
    let entregadoresQuery = supabase
        .from('dados_marketing')
        .select('id_entregador, nome, regiao_atuacao, rodando, rodou_dia')
        .not('id_entregador', 'is', null);

    // Aplicar filtro de cidade
    if (cidadeSelecionada) {
        if (cidadeSelecionada === 'Santo André') {
            entregadoresQuery = entregadoresQuery
                .eq('regiao_atuacao', 'ABC 2.0')
                .in('sub_praca_abc', ['Vila Aquino', 'São Caetano']);
        } else if (cidadeSelecionada === 'São Bernardo') {
            entregadoresQuery = entregadoresQuery
                .eq('regiao_atuacao', 'ABC 2.0')
                .in('sub_praca_abc', ['Diadema', 'Nova petrópolis', 'Rudge Ramos']);
        } else {
            entregadoresQuery = entregadoresQuery.eq('regiao_atuacao', cidadeSelecionada);
        }
    }

    // Aplicar filtro de pesquisa (Server-side)
    if (searchTerm) {
        entregadoresQuery = entregadoresQuery.or(`nome.ilike.%${searchTerm}%,id_entregador.eq.${searchTerm}`);
    }

    // Aplicar filtro de Rodou Dia
    if (filtroRodouDia.dataInicial) {
        entregadoresQuery = entregadoresQuery.gte('rodou_dia', filtroRodouDia.dataInicial);
    }

    const { data: entregadoresIds, error: idsError } = await entregadoresQuery;

    if (idsError) throw idsError;

    if (!entregadoresIds || entregadoresIds.length === 0) {
        return [];
    }

    const idsEntregadores = entregadoresIds
        .map(e => e.id_entregador)
        .filter((id): id is string => !!id);

    if (idsEntregadores.length === 0) {
        return [];
    }

    // Buscar em lotes PARALELOS
    const BATCH_SIZE = 100;
    const todasCorridas: any[] = [];
    const promises = [];

    for (let i = 0; i < idsEntregadores.length; i += BATCH_SIZE) {
        const batchIds = idsEntregadores.slice(i, i + BATCH_SIZE);

        let corridasQuery = supabase
            .from('dados_corridas')
            .select('id_da_pessoa_entregadora, numero_de_corridas_ofertadas, numero_de_corridas_aceitas, numero_de_corridas_completadas, numero_de_corridas_rejeitadas, data_do_periodo, tempo_disponivel_escalado_segundos')
            .in('id_da_pessoa_entregadora', batchIds);

        corridasQuery = corridasQuery.limit(QUERY_LIMITS.AGGREGATION_MAX);
        promises.push(corridasQuery);
    }

    const CONCURRENCY_LIMIT = 3;
    const results = [];

    for (let i = 0; i < promises.length; i += CONCURRENCY_LIMIT) {
        const chunk = promises.slice(i, i + CONCURRENCY_LIMIT);

        if (IS_DEV) {
            safeLog.info(`Processando lote ${Math.floor(i / CONCURRENCY_LIMIT) + 1} de ${Math.ceil(promises.length / CONCURRENCY_LIMIT)}`);
        }

        const chunkResults = await Promise.all(chunk);
        results.push(...chunkResults);

        if (i + CONCURRENCY_LIMIT < promises.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    for (const result of results) {
        const { data: batchData, error: batchError } = result;
        if (batchError) {
            safeLog.error('Erro ao buscar lote de corridas:', batchError);
            continue;
        }
        if (batchData) {
            todasCorridas.push(...batchData);
        }
    }

    const corridasPorEntregador = new Map<string, typeof todasCorridas>();
    if (todasCorridas) {
        for (const corrida of todasCorridas) {
            const id = corrida.id_da_pessoa_entregadora;
            if (!id) continue;
            if (!corridasPorEntregador.has(id)) {
                corridasPorEntregador.set(id, []);
            }
            corridasPorEntregador.get(id)!.push(corrida);
        }
    }

    const entregadoresComDados: EntregadorMarketing[] = [];

    for (const entregador of entregadoresIds) {
        if (!entregador.id_entregador) continue;

        const todasCorridasEntregador = corridasPorEntregador.get(entregador.id_entregador) || [];

        // Calcular Data Inicio
        let primeiraData: string | null = null;
        if (todasCorridasEntregador.length > 0) {
            const datasOrdenadas = todasCorridasEntregador
                .map(c => c.data_do_periodo)
                .filter((d): d is string => d != null)
                .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());

            if (datasOrdenadas.length > 0) {
                primeiraData = datasOrdenadas[0];
            }
        }

        // Filtro Data Inicio
        if (filtroDataInicio.dataInicial || filtroDataInicio.dataFinal) {
            if (!primeiraData) continue;
            if (filtroDataInicio.dataInicial && primeiraData < filtroDataInicio.dataInicial) continue;
            if (filtroDataInicio.dataFinal && primeiraData > filtroDataInicio.dataFinal) continue;
        }

        // Filtro Rodou Dia para métricas
        let corridasParaMetricas = todasCorridasEntregador;
        if (filtroRodouDia.dataInicial || filtroRodouDia.dataFinal) {
            corridasParaMetricas = todasCorridasEntregador.filter(c => {
                if (!c.data_do_periodo) return false;
                if (filtroRodouDia.dataInicial && c.data_do_periodo < filtroRodouDia.dataInicial) return false;
                if (filtroRodouDia.dataFinal && c.data_do_periodo > filtroRodouDia.dataFinal) return false;
                return true;
            });
        }

        // Agregar métricas (código duplicado do original, mantido para lógica igual)
        const total_ofertadas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_ofertadas || 0), 0);
        const total_aceitas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_aceitas || 0), 0);
        const total_completadas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_completadas || 0), 0);
        const total_rejeitadas = corridasParaMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_rejeitadas || 0), 0);
        const total_segundos = corridasParaMetricas.reduce((sum, c) => sum + (Number(c.tempo_disponivel_escalado_segundos) || 0), 0);

        let ultimaData: string | null = entregador.rodou_dia || null;
        if (todasCorridasEntregador.length > 0) {
            const datasRecentes = todasCorridasEntregador
                .map(c => c.data_do_periodo)
                .filter((d): d is string => d != null)
                .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

            if (datasRecentes.length > 0) {
                const ultimaCorrida = datasRecentes[0];
                if (ultimaCorrida && (!ultimaData || new Date(ultimaCorrida) > new Date(ultimaData))) {
                    ultimaData = ultimaCorrida;
                }
            }
        }

        let diasSemRodar: number | null = null;
        if (ultimaData) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const ultimaDataParts = ultimaData.split('-');
            const ultimaDataObj = new Date(
                Number(ultimaDataParts[0]),
                Number(ultimaDataParts[1]) - 1,
                Number(ultimaDataParts[2])
            );
            const diffTime = hoje.getTime() - ultimaDataObj.getTime();
            diasSemRodar = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        entregadoresComDados.push({
            id_entregador: entregador.id_entregador,
            nome: entregador.nome || 'Nome não informado',
            total_ofertadas,
            total_aceitas,
            total_completadas,
            total_rejeitadas,
            total_segundos,
            ultima_data: ultimaData,
            dias_sem_rodar: diasSemRodar,
            regiao_atuacao: entregador.regiao_atuacao || null,
            rodando: entregador.rodando || null,
        });
    }

    entregadoresComDados.sort((a, b) => a.nome.localeCompare(b.nome));

    if (IS_DEV) {
        safeLog.info(`✅ ${entregadoresComDados.length} entregador(es) encontrado(s) (fallback otimizado)`);
    }

    return entregadoresComDados;
}
