
import { AnaliseItem, calcularTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { formatarHorasParaHMS } from '@/utils/formatters';

// Helper local para formatação
export const formatarPorcentagem = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });
};

export const formatarNumero = (valor: number | undefined | null) => {
    if (valor === undefined || valor === null) return 0;
    return valor;
};

// Helper para converter item de aderência para AnaliseItem
export const toAnaliseItem = (item: any): AnaliseItem => {
    return {
        corridas_ofertadas: item.corridas_ofertadas,
        corridas_aceitas: item.corridas_aceitas,
        corridas_rejeitadas: item.corridas_rejeitadas,
        corridas_completadas: item.corridas_completadas,
        horas_entregues: item.horas_entregues // Não usado no cálculo, mas parte da interface
    };
};

export const gerarDadosFormatados = (dados: any[], campoChave: string, labelChave: string) => {
    if (!dados || dados.length === 0) return [];

    return dados.map(item => {
        const taxas = calcularTaxas(toAnaliseItem(item));
        const horas = formatarHorasParaHMS((item.segundos_realizados || 0) / 3600);

        // Determinar o rótulo da linha
        let label = item[campoChave] || 'N/A';
        if (campoChave === 'data') {
            // Tenta formatar data ou deixar como está
            label = item.dia_semana || item.data || 'N/A';
        }

        return {
            [labelChave]: label,
            'Ofertadas': formatarNumero(item.corridas_ofertadas),
            'Aceitas': formatarNumero(item.corridas_aceitas),
            'Rejeitadas': formatarNumero(item.corridas_rejeitadas),
            'Completadas': formatarNumero(item.corridas_completadas),
            'Taxa Aceitação': formatarPorcentagem(taxas.taxaAceitacao),
            'Taxa Rejeição': formatarPorcentagem(taxas.taxaRejeicao),
            'Taxa Completitude': formatarPorcentagem(taxas.taxaCompletude),
            'Horas Entregues': horas
        };
    });
};
