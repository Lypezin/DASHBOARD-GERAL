import { safeLog } from '@/lib/errorHandler';
import { loadXLSX } from '@/lib/xlsxClient';
import { formatarHorasParaHMS } from '@/utils/formatters';
import {
  buildDedicadoFilterPayload,
} from './rpcFallback';
import {
  calculateAcceptanceRate,
  calculateCompletionRate,
  calculateHourlyAderencia,
  formatMetricPercent,
  formatMetricPercentOrDash,
  normalizeMetricNumber,
} from './metrics';
import type { Entregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';

interface DedicadoExportPayload {
  totais?: {
    total_entregadores?: number;
    total_origens?: number;
    corridas_ofertadas?: number;
    corridas_aceitas?: number;
    corridas_rejeitadas?: number;
    corridas_completadas?: number;
    segundos_realizados?: number;
    segundos_planejados?: number;
  };
  origem?: Array<Record<string, unknown>>;
  dia_origem?: Array<Record<string, unknown>>;
  periodo_resolvido?: Record<string, unknown>;
}

interface DedicadoEntregadoresPayload {
  entregadores?: Entregador[];
  total?: number;
  periodo_resolvido?: Record<string, unknown>;
}

function buildRankingRows(entregadores: Entregador[]) {
  return [...entregadores]
    .sort((a, b) => {
      const aderenciaDiff = normalizeMetricNumber(b.aderencia_percentual) - normalizeMetricNumber(a.aderencia_percentual);
      if (aderenciaDiff !== 0) return aderenciaDiff;

      const completadasDiff = normalizeMetricNumber(b.corridas_completadas) - normalizeMetricNumber(a.corridas_completadas);
      if (completadasDiff !== 0) return completadasDiff;

      return normalizeMetricNumber(b.corridas_ofertadas) - normalizeMetricNumber(a.corridas_ofertadas);
    })
    .map((entregador, index) => ({
      Posicao: index + 1,
      'ID Entregador': entregador.id_entregador,
      Nome: entregador.nome_entregador,
      Aderencia: formatMetricPercent(entregador.aderencia_percentual),
      Horas: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600),
      Ofertadas: entregador.corridas_ofertadas || 0,
      Aceitas: entregador.corridas_aceitas || 0,
      Rejeitadas: entregador.corridas_rejeitadas || 0,
      Completadas: entregador.corridas_completadas || 0,
      'Taxa Rejeicao': formatMetricPercent(entregador.rejeicao_percentual),
      Observacao: normalizeMetricNumber(entregador.corridas_ofertadas) < 20 ? 'Baixo volume' : '',
    }));
}

function formatFilters(payload: Record<string, unknown>) {
  return [
    { Filtro: 'Organizacao', Valor: payload.p_organization_id || 'Todas' },
    { Filtro: 'Ano', Valor: payload.p_ano || 'Todos' },
    { Filtro: 'Semana', Valor: payload.p_semana === 0 ? 'Todas' : payload.p_semana || 'Todas' },
    { Filtro: 'Semanas selecionadas', Valor: Array.isArray(payload.p_semanas) && payload.p_semanas.length > 0 ? payload.p_semanas.join(', ') : 'Todas' },
    { Filtro: 'Praca', Valor: payload.p_praca || 'Todas' },
    { Filtro: 'Sub praca', Valor: payload.p_sub_praca || 'Todas' },
    { Filtro: 'Data inicial', Valor: payload.p_data_inicial || '-' },
    { Filtro: 'Data final', Valor: payload.p_data_final || '-' },
  ];
}

function appendSheet(XLSX: typeof import('xlsx'), workbook: import('xlsx').WorkBook, data: Record<string, unknown>[], sheetName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ Aviso: 'Sem dados para os filtros atuais' }]);
  worksheet['!cols'] = Object.keys(data[0] || { Aviso: '' }).map((key) => ({
    wch: Math.max(12, Math.min(34, key.length + 8)),
  }));
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

export async function exportarDedicadoParaExcel(filterPayload: FilterPayload): Promise<void> {
  try {
    const rpcPayload = buildDedicadoFilterPayload(filterPayload);
    const XLSX = await loadXLSX();
    const workbook = XLSX.utils.book_new();

    const [summaryResult, entregadoresResult] = await Promise.all([
      fetchDedicadoApi<DedicadoExportPayload>('summary', {
        ...rpcPayload,
        p_include_dia_origem: true,
      }),
      fetchDedicadoApi<DedicadoEntregadoresPayload>('entregadores', rpcPayload),
    ]);

    if (summaryResult.error) throw new Error(summaryResult.error.message || 'Erro ao buscar resumo do DEDICADO');
    if (entregadoresResult.error) throw new Error(entregadoresResult.error.message || 'Erro ao buscar entregadores do DEDICADO');

    const totals = summaryResult.data?.totais || {};
    const origemRows = Array.isArray(summaryResult.data?.origem) ? summaryResult.data.origem : [];
    const diaOrigemRows = Array.isArray(summaryResult.data?.dia_origem) ? summaryResult.data.dia_origem : [];
    const entregadores = Array.isArray(entregadoresResult.data?.entregadores) ? entregadoresResult.data.entregadores : [];

    appendSheet(XLSX, workbook, [
      { Indicador: 'Entregadores', Valor: normalizeMetricNumber(totals.total_entregadores) },
      { Indicador: 'Origens', Valor: normalizeMetricNumber(totals.total_origens) },
      { Indicador: 'Ofertadas', Valor: normalizeMetricNumber(totals.corridas_ofertadas) },
      { Indicador: 'Aceitas', Valor: normalizeMetricNumber(totals.corridas_aceitas) },
      { Indicador: 'Rejeitadas', Valor: normalizeMetricNumber(totals.corridas_rejeitadas) },
      { Indicador: 'Completadas', Valor: normalizeMetricNumber(totals.corridas_completadas) },
      { Indicador: 'Horas', Valor: formatarHorasParaHMS(normalizeMetricNumber(totals.segundos_realizados) / 3600) },
      { Indicador: 'Horas Planejadas', Valor: formatarHorasParaHMS(normalizeMetricNumber(totals.segundos_planejados) / 3600) },
      { Indicador: 'Aderencia Horas', Valor: formatMetricPercentOrDash(calculateHourlyAderencia(totals.segundos_realizados, totals.segundos_planejados), normalizeMetricNumber(totals.segundos_planejados) > 0) },
    ], 'Resumo');

    appendSheet(XLSX, workbook, origemRows.map((row) => ({
      Origem: row.origem || '-',
      Horas: formatarHorasParaHMS(normalizeMetricNumber(row.segundos_realizados) / 3600),
      Ofertadas: normalizeMetricNumber(row.corridas_ofertadas),
      Aceitas: normalizeMetricNumber(row.corridas_aceitas),
      '% Aceitas': formatMetricPercent(calculateAcceptanceRate(row.corridas_aceitas, row.corridas_ofertadas)),
      Rejeitadas: normalizeMetricNumber(row.corridas_rejeitadas),
      Completadas: normalizeMetricNumber(row.corridas_completadas),
      '% Completadas': formatMetricPercent(calculateCompletionRate(row.corridas_completadas, row.corridas_aceitas)),
      'Horas Planejadas': formatarHorasParaHMS(normalizeMetricNumber(row.segundos_planejados) / 3600),
      Aderencia: formatMetricPercentOrDash(calculateHourlyAderencia(row.segundos_realizados, row.segundos_planejados), normalizeMetricNumber(row.segundos_planejados) > 0),
    })), 'Origens');

    appendSheet(XLSX, workbook, entregadores.map((entregador) => ({
      'ID Entregador': entregador.id_entregador,
      Nome: entregador.nome_entregador,
      Horas: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600),
      Ofertadas: entregador.corridas_ofertadas || 0,
      Aceitas: entregador.corridas_aceitas || 0,
      '% Aceitas': formatMetricPercent(calculateAcceptanceRate(entregador.corridas_aceitas, entregador.corridas_ofertadas)),
      Rejeitadas: entregador.corridas_rejeitadas || 0,
      Completadas: entregador.corridas_completadas || 0,
      '% Completadas': formatMetricPercent(calculateCompletionRate(entregador.corridas_completadas, entregador.corridas_aceitas)),
      Aderencia: formatMetricPercent(entregador.aderencia_percentual),
      Rejeicao: formatMetricPercent(entregador.rejeicao_percentual),
    })), 'Entregadores');

    appendSheet(XLSX, workbook, buildRankingRows(entregadores), 'Ranking');

    appendSheet(XLSX, workbook, diaOrigemRows.map((row) => ({
      Dia: row.dia || '-',
      Data: row.data || '-',
      Origem: row.origem || '-',
      Horas: formatarHorasParaHMS(normalizeMetricNumber(row.segundos_realizados) / 3600),
      Ofertadas: normalizeMetricNumber(row.corridas_ofertadas),
      Aceitas: normalizeMetricNumber(row.corridas_aceitas),
      '% Aceitas': formatMetricPercent(calculateAcceptanceRate(row.corridas_aceitas, row.corridas_ofertadas)),
      Rejeitadas: normalizeMetricNumber(row.corridas_rejeitadas),
      Completadas: normalizeMetricNumber(row.corridas_completadas),
      '% Completadas': formatMetricPercent(calculateCompletionRate(row.corridas_completadas, row.corridas_aceitas)),
      'Horas Planejadas': formatarHorasParaHMS(normalizeMetricNumber(row.segundos_planejados) / 3600),
      Aderencia: formatMetricPercentOrDash(calculateHourlyAderencia(row.segundos_realizados, row.segundos_planejados), normalizeMetricNumber(row.segundos_planejados) > 0),
    })), 'Dia x Origem');

    appendSheet(XLSX, workbook, formatFilters(rpcPayload), 'Filtros');

    const dataHora = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    XLSX.writeFile(workbook, `dedicado_${dataHora}.xlsx`);
  } catch (error) {
    safeLog.error('Erro ao exportar DEDICADO para Excel:', error);
    throw new Error('Falha ao gerar Excel do DEDICADO.');
  }
}
