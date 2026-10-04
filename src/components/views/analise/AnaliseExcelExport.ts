import { Totals, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { calcularTaxas } from '@/hooks/analise/useAnaliseTaxas';
import { formatarNumero, gerarDadosFormatados, toAnaliseItem } from './excel/AnaliseExcelHelpers';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata, assertExcelRowLimit, createExcelFilterRows, writeWorkbookFile } from '@/utils/excel/workbookStyle';
import type { FilterPayload } from '@/types/filters';

export async function exportarAnaliseParaExcel(
  totals: Totals,
  aderenciaDia: AderenciaDia[],
  aderenciaTurno: AderenciaTurno[],
  aderenciaSubPraca: AderenciaSubPraca[],
  aderenciaOrigem: AderenciaOrigem[],
  aderenciaDiaOrigem: any[],
  filters?: FilterPayload
): Promise<void> {
  try {
    [aderenciaDia, aderenciaTurno, aderenciaSubPraca, aderenciaOrigem, aderenciaDiaOrigem].forEach((rows) => assertExcelRowLimit(rows?.length || 0));
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
    const diaOrigemFormatado = aderenciaDiaOrigem.map((item) => {
      const taxas = calcularTaxas(toAnaliseItem(item));
      const horasEntregues = item.horas_entregues || formatarHorasParaHMS((item.segundos_realizados || 0) / 3600);

      return {
        Dia: item.dia || 'N/A',
        'Dia da Semana (ISO)': item.dia_iso ?? '',
        Origem: item.origem || 'N/A',
        Ofertadas: formatarNumero(item.corridas_ofertadas),
        Aceitas: formatarNumero(item.corridas_aceitas),
        Rejeitadas: formatarNumero(item.corridas_rejeitadas),
        Completadas: formatarNumero(item.corridas_completadas),
        'Taxa Aceitacao': taxas.taxaAceitacao,
        'Taxa Rejeicao': taxas.taxaRejeicao,
        'Taxa Completude': taxas.taxaCompletude,
        'Aderencia (%)': item.aderencia_percentual,
        'Horas Entregues': horasEntregues,
      };
    });
    appendStyledJsonSheet(XLSX, wb, diaOrigemFormatado, 'Dia x Origem', {
      title: 'Dia x Origem',
      theme: 'slate',
      highlightFirstColumn: true,
    });
    appendStyledJsonSheet(XLSX, wb, createExcelFilterRows(filters), 'Filtros', {
      title: 'Filtros aplicados',
      theme: 'slate',
      highlightFirstColumn: true,
    });

    const agora = new Date();
    const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const nomeArquivo = `analise_taxas_${dataHora}.xlsx`;

    await writeWorkbookFile(XLSX, wb, nomeArquivo);

    if (IS_DEV) safeLog.info(`Analise exportada: ${nomeArquivo}`);
  } catch (error) {
    safeLog.error('Erro ao exportar analise:', error);
    throw error instanceof Error ? error : new Error('Falha ao gerar arquivo Excel de Analise.');
  }
}
