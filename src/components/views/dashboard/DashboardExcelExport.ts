import { AderenciaSemanal, AderenciaDia, AderenciaTurno, AderenciaSubPraca, AderenciaOrigem } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { IS_DEV } from '@/constants/environment';


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

    if (aderenciaGeral) {
      let horasRealizadas = aderenciaGeral.horas_entregues;
      if (!horasRealizadas || horasRealizadas === '00:00:00') {
        horasRealizadas = formatarHorasParaHMS((aderenciaGeral.segundos_realizados || 0) / 3600);
      }

      let horasPlanejadas = aderenciaGeral.horas_a_entregar;
      if (!horasPlanejadas || horasPlanejadas === '00:00:00') {
        horasPlanejadas = formatarHorasParaHMS((aderenciaGeral.segundos_planejados || 0) / 3600);
      }

      const resumoData = [{
        Métrica: 'Horas',
        Realizado: horasRealizadas,
        Planejado: horasPlanejadas,
        Aderência: formatarPorcentagem(aderenciaGeral.aderencia_percentual || 0),
      }];
      const wsResumo = XLSX.utils.json_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');
    }

    if (aderenciaDia?.length > 0) {
      const diasData = aderenciaDia.map((d) => ({
        Dia: d.dia_semana || d.data || 'N/A',
        Data: d.data || '-',
        'Horas Realizadas': formatarHorasParaHMS((d.segundos_realizados || 0) / 3600),
        'Horas Planejadas': formatarHorasParaHMS((d.segundos_planejados || 0) / 3600),
        Aderência: formatarPorcentagem(d.aderencia_percentual || 0),
        'Corridas Completadas': d.corridas_completadas || 0,
      }));
      const wsDias = XLSX.utils.json_to_sheet(diasData);
      XLSX.utils.book_append_sheet(wb, wsDias, 'Por Dia');
    }

    if (aderenciaTurno?.length > 0) {
      const turnoData = aderenciaTurno.map((t) => ({
        Turno: t.turno,
        'Horas Realizadas': formatarHorasParaHMS((t.segundos_realizados || 0) / 3600),
        'Horas Planejadas': formatarHorasParaHMS((t.segundos_planejados || 0) / 3600),
        Aderência: formatarPorcentagem(t.aderencia_percentual || 0),
        'Corridas Completadas': t.corridas_completadas || 0,
      }));
      const wsTurno = XLSX.utils.json_to_sheet(turnoData);
      XLSX.utils.book_append_sheet(wb, wsTurno, 'Por Turno');
    }

    if (aderenciaSubPraca?.length > 0) {
      const subData = aderenciaSubPraca.map((s) => ({
        'Sub-Praça': s.sub_praca,
        'Horas Realizadas': formatarHorasParaHMS((s.segundos_realizados || 0) / 3600),
        'Horas Planejadas': formatarHorasParaHMS((s.segundos_planejados || 0) / 3600),
        Aderência: formatarPorcentagem(s.aderencia_percentual || 0),
        'Corridas Completadas': s.corridas_completadas || 0,
      }));
      const wsSub = XLSX.utils.json_to_sheet(subData);
      XLSX.utils.book_append_sheet(wb, wsSub, 'Por Sub-Praça');
    }

    if (aderenciaOrigem?.length > 0) {
      const origemData = aderenciaOrigem.map((o) => ({
        Origem: o.origem,
        'Horas Realizadas': formatarHorasParaHMS((o.segundos_realizados || 0) / 3600),
        'Horas Planejadas': formatarHorasParaHMS((o.segundos_planejados || 0) / 3600),
        Aderência: formatarPorcentagem(o.aderencia_percentual || 0),
        'Corridas Completadas': o.corridas_completadas || 0,
      }));
      const wsOrigem = XLSX.utils.json_to_sheet(origemData);
      XLSX.utils.book_append_sheet(wb, wsOrigem, 'Por Origem');
    }

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
