import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { calcularTaxas, AnaliseItem } from '@/hooks/analise/useAnaliseTaxas';

const IS_DEV = process.env.NODE_ENV === 'development';

// Helper local para formatação
const formatarPorcentagem = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });
};

const formatarNumero = (valor: number | undefined | null) => {
    if (valor === undefined || valor === null) return 0;
    return valor;
};

// Helper para converter item de aderência para AnaliseItem (para usar o calcularTaxas)
const toAnaliseItem = (item: any): AnaliseItem => {
    return {
        corridas_ofertadas: item.corridas_ofertadas,
        corridas_aceitas: item.corridas_aceitas,
        corridas_rejeitadas: item.corridas_rejeitadas,
        corridas_completadas: item.corridas_completadas,
        horas_entregues: item.horas_entregues // Não usado no cálculo, mas parte da interface
    };
};

export async function exportarAnaliseParaExcel(
    totals: Totals,
    aderenciaDia: AderenciaDia[],
    aderenciaTurno: AderenciaTurno[],
    aderenciaSubPraca: AderenciaSubPraca[],
    aderenciaOrigem: AderenciaOrigem[]
): Promise<void> {
    try {
        const XLSX = await loadXLSX();
        const wb = XLSX.utils.book_new();

        // 1. Aba: Resumo Geral
        if (totals) {
            // Calcular taxas totais
            const { taxaAceitacao, taxaCompletude, taxaRejeicao } = calcularTaxas({
                corridas_ofertadas: totals.ofertadas,
                corridas_aceitas: totals.aceitas,
                corridas_rejeitadas: totals.rejeitadas,
                corridas_completadas: totals.completadas
            });

            // Calcular total de horas (soma dos dias)
            const segundosTotais = aderenciaDia.reduce((acc, curr) => acc + (curr.segundos_realizados || 0), 0);
            const horasFormatadas = formatarHorasParaHMS(segundosTotais / 3600);

            const resumoData = [{
                'Métrica': 'Resumo Geral',
                'Ofertadas': formatarNumero(totals.ofertadas),
                'Aceitas': formatarNumero(totals.aceitas),
                'Rejeitadas': formatarNumero(totals.rejeitadas),
                'Completadas': formatarNumero(totals.completadas),
                'Taxa Aceitação': formatarPorcentagem(taxaAceitacao),
                'Taxa Rejeição': formatarPorcentagem(taxaRejeicao),
                'Taxa Completitude': formatarPorcentagem(taxaCompletude),
                'Horas Entregues': horasFormatadas
            }];
            const wsResumo = XLSX.utils.json_to_sheet(resumoData);
            XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');
        }

        // Função helper para gerar planilhas detalhadas
        const gerarPlanilhaDetalhada = (dados: any[], nomePlanilha: string, campoChave: string, labelChave: string) => {
            if (!dados || dados.length === 0) return;

            const dadosFormatados = dados.map(item => {
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

            const ws = XLSX.utils.json_to_sheet(dadosFormatados);
            XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);
        };

        // 2. Aba: Por Dia
        gerarPlanilhaDetalhada(aderenciaDia, 'Por Dia', 'data', 'Dia');

        // 3. Aba: Por Turno
        gerarPlanilhaDetalhada(aderenciaTurno, 'Por Turno', 'turno', 'Turno');

        // 4. Aba: Por Sub-Praça
        gerarPlanilhaDetalhada(aderenciaSubPraca, 'Por Sub-Praça', 'sub_praca', 'Sub-Praça');

        // 5. Aba: Por Origem
        gerarPlanilhaDetalhada(aderenciaOrigem, 'Por Origem', 'origem', 'Origem');

        // Gerar Nome do Arquivo
        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const nomeArquivo = `analise_taxas_${dataHora}.xlsx`;

        // Download
        XLSX.writeFile(wb, nomeArquivo);

        if (IS_DEV) safeLog.info(`✅ Análise exportada: ${nomeArquivo}`);

    } catch (error) {
        safeLog.error('Erro ao exportar análise:', error);
        throw new Error('Falha ao gerar arquivo Excel de Análise.');
    }
}
