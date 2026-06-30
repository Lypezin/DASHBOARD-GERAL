import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

export async function exportarDashboardParaExcel(
  aderenciaGeral: AderenciaSemanal | undefined,
  aderenciaDia: AderenciaDia[],
  aderenciaTurno: AderenciaTurno[],
  aderenciaSubPraca: AderenciaSubPraca[],
  aderenciaOrigem: AderenciaOrigem[]
): Promise<void> {
  try {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    applyWorkbookMetadata(wb, 'Resumo do dashboard');

    if (aderenciaGeral) {
      let horasRealizadas = aderenciaGeral.horas_entregues;
      if (!horasRealizadas || horasRealizadas === '00:00:00') {
        horasRealizadas = formatarHorasParaHMS((aderenciaGeral.segundos_realizados || 0) / 3600);
      }

      let horasPlanejadas = aderenciaGeral.horas_a_entregar;
      if (!horasPlanejadas || horasPlanejadas === '00:00:00') {
        horasPlanejadas = formatarHorasParaHMS((aderenciaGeral.segundos_planejados || 0) / 3600);
      }

      appendStyledJsonSheet(XLSX, wb, [{
        Metrica: 'Horas',
        Realizado: horasRealizadas,
        Planejado: horasPlanejadas,
        Aderencia: aderenciaGeral.aderencia_percentual || 0,
      }], 'Resumo Geral', {
        title: 'Resumo geral',
        theme: 'blue',
        highlightFirstColumn: true,
      });
    }

    appendStyledJsonSheet(XLSX, wb, (aderenciaDia || []).map((d) => ({
      Dia: d.dia_semana || d.data || 'N/A',
      Data: d.data || '-',
      'Horas Realizadas': formatarHorasParaHMS((d.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((d.segundos_planejados || 0) / 3600),
      Aderencia: d.aderencia_percentual || 0,
      'Corridas Completadas': d.corridas_completadas || 0,
    })), 'Por Dia', { title: 'Por dia', theme: 'green', highlightFirstColumn: true });

    appendStyledJsonSheet(XLSX, wb, (aderenciaTurno || []).map((t) => ({
      Turno: t.turno,
      'Horas Realizadas': formatarHorasParaHMS((t.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((t.segundos_planejados || 0) / 3600),
      Aderencia: t.aderencia_percentual || 0,
      'Corridas Completadas': t.corridas_completadas || 0,
    })), 'Por Turno', { title: 'Por turno', theme: 'amber', highlightFirstColumn: true });

    appendStyledJsonSheet(XLSX, wb, (aderenciaSubPraca || []).map((s) => ({
      'Sub-Praca': s.sub_praca,
      'Horas Realizadas': formatarHorasParaHMS((s.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((s.segundos_planejados || 0) / 3600),
      Aderencia: s.aderencia_percentual || 0,
      'Corridas Completadas': s.corridas_completadas || 0,
    })), 'Por Sub-Praca', { title: 'Por sub-praca', theme: 'purple', highlightFirstColumn: true });

    appendStyledJsonSheet(XLSX, wb, (aderenciaOrigem || []).map((o) => ({
      Origem: o.origem,
      'Horas Realizadas': formatarHorasParaHMS((o.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((o.segundos_planejados || 0) / 3600),
      Aderencia: o.aderencia_percentual || 0,
      'Corridas Completadas': o.corridas_completadas || 0,
    })), 'Por Origem', { title: 'Por origem', theme: 'slate', highlightFirstColumn: true });

    const agora = new Date();
    const dataHora = agora.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const nomeArquivo = `dashboard_resumo_${dataHora}.xlsx`;

    XLSX.writeFile(wb, nomeArquivo);

    if (IS_DEV) safeLog.info(`Dashboard exportado: ${nomeArquivo}`);
  } catch (error) {
    safeLog.error('Erro ao exportar dashboard:', error);
    throw new Error('Falha ao gerar arquivo Excel do Dashboard.');
  }
}
