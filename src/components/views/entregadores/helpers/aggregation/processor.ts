import { EntregadorMarketing, MarketingDateFilter } from '@/types';

export function processEntregadorData(
    entregador: any,
    filterDataInicio: MarketingDateFilter,
    filterRodouDia: MarketingDateFilter,
    corridas: any[]
): EntregadorMarketing | null {

    if (!entregador.id_entregador) return null;

    // Calcular Data Inicio
    let primeiraData: string | null = null;
    if (corridas.length > 0) {
        const datasOrdenadas = corridas
            .map(c => c.data_do_periodo)
            .filter((d): d is string => d != null)
            .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());

        if (datasOrdenadas.length > 0) primeiraData = datasOrdenadas[0];
    }

    // Filtro Data Inicio
    if (filterDataInicio.dataInicial || filterDataInicio.dataFinal) {
        if (!primeiraData) return null;
        if (filterDataInicio.dataInicial && primeiraData < filterDataInicio.dataInicial) return null;
        if (filterDataInicio.dataFinal && primeiraData > filterDataInicio.dataFinal) return null;
    }

    // Filtro Rodou Dia métricas
    let corridasMetricas = corridas;
    if (filterRodouDia.dataInicial || filterRodouDia.dataFinal) {
        corridasMetricas = corridas.filter(c => {
            if (!c.data_do_periodo) return false;
            if (filterRodouDia.dataInicial && c.data_do_periodo < filterRodouDia.dataInicial) return false;
            if (filterRodouDia.dataFinal && c.data_do_periodo > filterRodouDia.dataFinal) return false;
            return true;
        });
    }

    const total_ofertadas = corridasMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_ofertadas || 0), 0);
    const total_aceitas = corridasMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_aceitas || 0), 0);
    const total_completadas = corridasMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_completadas || 0), 0);
    const total_rejeitadas = corridasMetricas.reduce((sum, c) => sum + (c.numero_de_corridas_rejeitadas || 0), 0);
    const total_segundos = corridasMetricas.reduce((sum, c) => sum + (Number(c.tempo_disponivel_escalado_segundos) || 0), 0);

    let ultimaData: string | null = entregador.rodou_dia || null;
    if (corridas.length > 0) {
        const datasRecentes = corridas
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
        const [ano, mes, dia] = ultimaData.split('-').map(Number);
        const ultimaDataObj = new Date(ano, mes - 1, dia);
        const diffTime = hoje.getTime() - ultimaDataObj.getTime();
        diasSemRodar = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
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
    };
}
