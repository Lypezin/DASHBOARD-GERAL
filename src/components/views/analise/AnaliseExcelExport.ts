import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { calcularTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { formatarNumero, gerarDadosFormatados } from './excel/AnaliseExcelHelpers';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

export async function exportarAnaliseParaExcel(
  totals: Totals,
  aderenciaDia: AderenciaDia[],
  aderenciaTurno: AderenciaTurno[],
  aderenciaSubPraca: AderenciaSubPraca[],
  aderenciaOrigem: AderenciaOrigem[],
  aderenciaDiaOrigem: any[]
): Promise<void> {
  try {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    applyWorkbookMetadata(wb, 'Analise de taxas');

    if (totals) {
      const { taxaAceitacao, taxaCompletude, taxaRejeicao } = calcularTaxas({
        corridas_ofertadas: totals.ofertadas,
        corridas_aceitas: totals.aceitas,
        corridas_rejeitadas: totals.rejeitadas,
        corridas_completadas: totals.completadas,
      });

      const segundosTotais = aderenciaDia.reduce((acc, curr) => acc + (curr.segundos_realizados || 0), 0);
      const horasFormatadas = formatarHorasParaHMS(segundosTotais / 3600);

      const resumoData = [{
        Metrica: 'Resumo Geral',
        Ofertadas: formatarNumero(totals.ofertadas),
        Aceitas: formatarNumero(totals.aceitas),
        Rejeitadas: formatarNumero(totals.rejeitadas),
        Completadas: formatarNumero(totals.completadas),
        'Taxa Aceitacao': taxaAceitacao,
        'Taxa Rejeicao': taxaRejeicao,
        'Taxa Completude': taxaCompletude,
        'Horas Entregues': horasFormatadas,
      }];

      appendStyledJsonSheet(XLSX, wb, resumoData, 'Resumo Geral', {
        title: 'Resumo geral',
        theme: 'blue',
        highlightFirstColumn: true,
      });
    }

    const appendPlanilha = (dados: any[], nomePlanilha: string, campoChave: string, labelChave: string) => {
      const dadosFormatados = gerarDadosFormatados(dados, campoChave, labelChave);
      appendStyledJsonSheet(XLSX, wb, dadosFormatados, nomePlanilha, {
        title: nomePlanilha,
        theme: 'slate',
        highlightFirstColumn: true,
      });
    };

    appendPlanilha(aderenciaDia, 'Por Dia', 'data', 'Dia');
    appendPlanilha(aderenciaTurno, 'Por Turno', 'turno', 'Turno');
    appendPlanilha(aderenciaSubPraca, 'Por Sub-Praca', 'sub_praca', 'Sub-Praca');
    appendPlanilha(aderenciaOrigem, 'Por Origem', 'origem', 'Origem');
    appendPlanilha(aderenciaDiaOrigem, 'Dia x Origem', 'origem', 'Origem');

    const agora = new Date();
    const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const nomeArquivo = `analise_taxas_${dataHora}.xlsx`;

    XLSX.writeFile(wb, nomeArquivo);

    if (IS_DEV) safeLog.info(`Analise exportada: ${nomeArquivo}`);
  } catch (error) {
    safeLog.error('Erro ao exportar analise:', error);
    throw new Error('Falha ao gerar arquivo Excel de Analise.');
  }
}
