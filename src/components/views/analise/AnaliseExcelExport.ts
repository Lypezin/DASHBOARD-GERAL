import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { calcularTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { formatarPorcentagem, formatarNumero, gerarDadosFormatados } from './excel/AnaliseExcelHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

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
        const appendPlanilha = (dados: any[], nomePlanilha: string, campoChave: string, labelChave: string) => {
            const dadosFormatados = gerarDadosFormatados(dados, campoChave, labelChave);
            if (dadosFormatados.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dadosFormatados);
                XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);
            }
        };

        // 2. Aba: Por Dia
        appendPlanilha(aderenciaDia, 'Por Dia', 'data', 'Dia');

        // 3. Aba: Por Turno
        appendPlanilha(aderenciaTurno, 'Por Turno', 'turno', 'Turno');

        // 4. Aba: Por Sub-Praça
        appendPlanilha(aderenciaSubPraca, 'Por Sub-Praça', 'sub_praca', 'Sub-Praça');

        // 5. Aba: Por Origem
        appendPlanilha(aderenciaOrigem, 'Por Origem', 'origem', 'Origem');

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
