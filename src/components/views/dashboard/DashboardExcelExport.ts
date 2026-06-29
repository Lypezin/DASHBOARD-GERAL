import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { IS_DEV } from '@/constants/environment';
import { appendStyledJsonSheet, applyWorkbookMetadata } from '@/utils/excel/workbookStyle';

const formatarPorcentagem = (valor: number) => (valor / 100).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });

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
        Métrica: 'Horas',
        Realizado: horasRealizadas,
        Planejado: horasPlanejadas,
        Aderência: formatarPorcentagem(aderenciaGeral.aderencia_percentual || 0),
      }], 'Resumo Geral', {
        title: 'Resumo geral',
        theme: 'blue',
      });
    }

    appendStyledJsonSheet(XLSX, wb, (aderenciaDia || []).map((d) => ({
      Dia: d.dia_semana || d.data || 'N/A',
      Data: d.data || '-',
      'Horas Realizadas': formatarHorasParaHMS((d.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((d.segundos_planejados || 0) / 3600),
      Aderência: formatarPorcentagem(d.aderencia_percentual || 0),
      'Corridas Completadas': d.corridas_completadas || 0,
    })), 'Por Dia', { title: 'Por dia', theme: 'green' });

    appendStyledJsonSheet(XLSX, wb, (aderenciaTurno || []).map((t) => ({
      Turno: t.turno,
      'Horas Realizadas': formatarHorasParaHMS((t.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((t.segundos_planejados || 0) / 3600),
      Aderência: formatarPorcentagem(t.aderencia_percentual || 0),
      'Corridas Completadas': t.corridas_completadas || 0,
    })), 'Por Turno', { title: 'Por turno', theme: 'amber' });

    appendStyledJsonSheet(XLSX, wb, (aderenciaSubPraca || []).map((s) => ({
      'Sub-Praça': s.sub_praca,
      'Horas Realizadas': formatarHorasParaHMS((s.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((s.segundos_planejados || 0) / 3600),
      Aderência: formatarPorcentagem(s.aderencia_percentual || 0),
      'Corridas Completadas': s.corridas_completadas || 0,
    })), 'Por Sub-Praça', { title: 'Por sub-praça', theme: 'purple' });

    appendStyledJsonSheet(XLSX, wb, (aderenciaOrigem || []).map((o) => ({
      Origem: o.origem,
      'Horas Realizadas': formatarHorasParaHMS((o.segundos_realizados || 0) / 3600),
      'Horas Planejadas': formatarHorasParaHMS((o.segundos_planejados || 0) / 3600),
      Aderência: formatarPorcentagem(o.aderencia_percentual || 0),
      'Corridas Completadas': o.corridas_completadas || 0,
    })), 'Por Origem', { title: 'Por origem', theme: 'slate' });

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
