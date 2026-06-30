import { AnaliseItem, calcularTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { formatarHorasParaHMS } from '@/utils/formatters';

export const formatarNumero = (valor: number | undefined | null) => {
    if (valor === undefined || valor === null) return 0;
    return valor;
};

export const toAnaliseItem = (item: any): AnaliseItem => {
    return {
        corridas_ofertadas: item.corridas_ofertadas,
        corridas_aceitas: item.corridas_aceitas,
        corridas_rejeitadas: item.corridas_rejeitadas,
        corridas_completadas: item.corridas_completadas,
        horas_entregues: item.horas_entregues,
    };
};

export const gerarDadosFormatados = (dados: any[], campoChave: string, labelChave: string) => {
    if (!dados || dados.length === 0) return [];

    return dados.map((item) => {
        const taxas = calcularTaxas(toAnaliseItem(item));
        const horas = formatarHorasParaHMS((item.segundos_realizados || 0) / 3600);

        let label = item[campoChave] || 'N/A';
        if (campoChave === 'data') {
            label = item.dia_semana || item.data || 'N/A';
        }

        return {
            [labelChave]: label,
            Ofertadas: formatarNumero(item.corridas_ofertadas),
            Aceitas: formatarNumero(item.corridas_aceitas),
            Rejeitadas: formatarNumero(item.corridas_rejeitadas),
            Completadas: formatarNumero(item.corridas_completadas),
            'Taxa Aceitacao': taxas.taxaAceitacao,
            'Taxa Rejeicao': taxas.taxaRejeicao,
            'Taxa Completude': taxas.taxaCompletude,
            'Horas Entregues': horas,
        };
    });
};
