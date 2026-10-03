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
  normalizeMetricNumber,
} from './metrics';
import type { Entregador } from '@/types';
import type { FilterPayload } from '@/types/filters';
import { fetchDedicadoApi } from '@/utils/dedicado/fetchDedicadoApi';
import { appendStyledJsonSheet, applyWorkbookMetadata, assertExcelRowLimit } from '@/utils/excel/workbookStyle';

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
      ['Posi\u00e7\u00e3o']: index + 1,
      'ID Entregador': entregador.id_entregador,
      Nome: entregador.nome_entregador,
      ['Ader\u00eancia']: normalizeMetricNumber(entregador.aderencia_percentual),
      Horas: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600),
      Ofertadas: entregador.corridas_ofertadas || 0,
      Aceitas: entregador.corridas_aceitas || 0,
      Rejeitadas: entregador.corridas_rejeitadas || 0,
      Completadas: entregador.corridas_completadas || 0,
      ['Taxa Rejei\u00e7\u00e3o']: normalizeMetricNumber(entregador.rejeicao_percentual),
      ['Observa\u00e7\u00e3o']: normalizeMetricNumber(entregador.corridas_ofertadas) < 20 ? 'Baixo volume' : '',
    }));
}

function formatFilters(payload: Record<string, unknown>) {
  return [
    { Filtro: 'Organiza\u00e7\u00e3o', Valor: payload.p_organization_id || 'Todas' },
    { Filtro: 'Ano', Valor: payload.p_ano || 'Todos' },
    { Filtro: 'Semana', Valor: payload.p_semana === 0 ? 'Todas' : payload.p_semana || 'Todas' },
    { Filtro: 'Semanas selecionadas', Valor: Array.isArray(payload.p_semanas) && payload.p_semanas.length > 0 ? payload.p_semanas.join(', ') : 'Todas' },
    { Filtro: 'Pra\u00e7a', Valor: payload.p_praca || 'Todas' },
    { Filtro: 'Sub-pra\u00e7a', Valor: payload.p_sub_praca || 'Todas' },
    { Filtro: 'Data inicial', Valor: payload.p_data_inicial || '-' },
    { Filtro: 'Data final', Valor: payload.p_data_final || '-' },
  ];
}

function hasFiniteNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
}

function assertNumericFields(row: Record<string, unknown>, fields: string[], label: string) {
  if (fields.some((field) => !hasFiniteNumber(row[field]))) {
    throw new Error(`O relatório de ${label} veio com métricas ausentes ou inválidas. Gere o arquivo novamente.`);
  }
}

function assertRowsHaveNumericFields(rows: Array<Record<string, unknown>>, fields: string[], label: string) {
  rows.forEach((row) => assertNumericFields(row, fields, label));
}

function appendSheet(XLSX: typeof import('xlsx'), workbook: import('xlsx').WorkBook, data: Record<string, unknown>[], sheetName: string) {
  appendStyledJsonSheet(XLSX, workbook, data, sheetName, {
    title: `DEDICADO - ${sheetName}`,
    theme: sheetName === 'Ranking' ? 'amber' : sheetName === 'Filtros' ? 'slate' : 'blue',
    highlightFirstColumn: true,
  });
}

export async function exportarDedicadoParaExcel(filterPayload: FilterPayload, requestScopeKey?: string): Promise<void> {
  try {
    const rpcPayload = buildDedicadoFilterPayload(filterPayload);
    const XLSX = await loadXLSX();
    const workbook = XLSX.utils.book_new();
    applyWorkbookMetadata(workbook, 'DEDICADO');

    const [summaryResult, entregadoresResult] = await Promise.all([
      fetchDedicadoApi<DedicadoExportPayload>('summary', {
        ...rpcPayload,
        p_include_dia_origem: true,
      }, requestScopeKey),
      fetchDedicadoApi<DedicadoEntregadoresPayload>('entregadores', rpcPayload, requestScopeKey),
    ]);

    if (summaryResult.error) throw new Error(summaryResult.error.message || 'Erro ao buscar resumo do DEDICADO');
    if (entregadoresResult.error) throw new Error(entregadoresResult.error.message || 'Erro ao buscar entregadores do DEDICADO');

    const summary = summaryResult.data;
    const driverPayload = entregadoresResult.data;
    if (!summary?.totais || !Array.isArray(summary.origem) || !Array.isArray(summary.dia_origem)) {
      throw new Error('O resumo do DEDICADO veio incompleto. Tente gerar o arquivo novamente.');
    }
    if (!driverPayload || !Array.isArray(driverPayload.entregadores)) {
      throw new Error('A lista de entregadores do DEDICADO veio incompleta. Tente gerar o arquivo novamente.');
    }

    const totals = summary.totais;
    const origemRows = summary.origem;
    const diaOrigemRows = summary.dia_origem;
    const entregadores = driverPayload.entregadores;
    const totalEntregadoresResumo = Number(totals.total_entregadores);
    const totalEntregadores = Number(driverPayload.total);
    if (!Number.isSafeInteger(totalEntregadores) || totalEntregadores < 0 || totalEntregadores !== entregadores.length) {
      throw new Error('A lista de entregadores recebida para o Excel está incompleta. Tente novamente.');
    }
    if (totalEntregadoresResumo !== totalEntregadores) {
      throw new Error('O resumo e a lista de entregadores retornaram totais diferentes. Gere o Excel novamente.');
    }
    [origemRows, diaOrigemRows, entregadores].forEach((rows) => assertExcelRowLimit(rows.length));

    assertNumericFields(totals as Record<string, unknown>, [
      'total_entregadores', 'total_origens', 'corridas_ofertadas', 'corridas_aceitas',
      'corridas_rejeitadas', 'corridas_completadas', 'segundos_realizados', 'segundos_planejados',
    ], 'resumo');
    const rowMetricFields = [
      'segundos_realizados', 'segundos_planejados', 'corridas_ofertadas', 'corridas_aceitas',
      'corridas_rejeitadas', 'corridas_completadas',
    ];
    assertRowsHaveNumericFields(origemRows, rowMetricFields, 'origens');
    assertRowsHaveNumericFields(diaOrigemRows, rowMetricFields, 'dia x origem');
    assertRowsHaveNumericFields(entregadores as unknown as Array<Record<string, unknown>>, [
      'total_segundos', 'corridas_ofertadas', 'corridas_aceitas', 'corridas_rejeitadas',
      'corridas_completadas', 'aderencia_percentual', 'rejeicao_percentual',
    ], 'entregadores');

    appendSheet(XLSX, workbook, [
      { Indicador: 'Entregadores', Valor: normalizeMetricNumber(totals.total_entregadores) },
      { Indicador: 'Origens', Valor: normalizeMetricNumber(totals.total_origens) },
      { Indicador: 'Ofertadas', Valor: normalizeMetricNumber(totals.corridas_ofertadas) },
      { Indicador: 'Aceitas', Valor: normalizeMetricNumber(totals.corridas_aceitas) },
      { Indicador: 'Rejeitadas', Valor: normalizeMetricNumber(totals.corridas_rejeitadas) },
      { Indicador: 'Completadas', Valor: normalizeMetricNumber(totals.corridas_completadas) },
      { Indicador: 'Horas', Valor: formatarHorasParaHMS(normalizeMetricNumber(totals.segundos_realizados) / 3600) },
      { Indicador: 'Horas Planejadas', Valor: formatarHorasParaHMS(normalizeMetricNumber(totals.segundos_planejados) / 3600) },
      { Indicador: 'Ader\u00eancia Horas', Valor: formatMetricPercent(calculateHourlyAderencia(totals.segundos_realizados, totals.segundos_planejados)) },
    ], 'Resumo');

    appendSheet(XLSX, workbook, origemRows.map((row) => ({
      Origem: row.origem || '-',
      Horas: formatarHorasParaHMS(normalizeMetricNumber(row.segundos_realizados) / 3600),
      Ofertadas: normalizeMetricNumber(row.corridas_ofertadas),
      Aceitas: normalizeMetricNumber(row.corridas_aceitas),
      '% Aceitas': calculateAcceptanceRate(row.corridas_aceitas, row.corridas_ofertadas),
      Rejeitadas: normalizeMetricNumber(row.corridas_rejeitadas),
      Completadas: normalizeMetricNumber(row.corridas_completadas),
      '% Completadas': calculateCompletionRate(row.corridas_completadas, row.corridas_aceitas),
      'Horas Planejadas': formatarHorasParaHMS(normalizeMetricNumber(row.segundos_planejados) / 3600),
      ['Ader\u00eancia']: normalizeMetricNumber(row.segundos_planejados) > 0 ? calculateHourlyAderencia(row.segundos_realizados, row.segundos_planejados) : 0,
    })), 'Origens');

    appendSheet(XLSX, workbook, entregadores.map((entregador) => ({
      'ID Entregador': entregador.id_entregador,
      Nome: entregador.nome_entregador,
      Horas: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600),
      Ofertadas: entregador.corridas_ofertadas || 0,
      Aceitas: entregador.corridas_aceitas || 0,
      '% Aceitas': calculateAcceptanceRate(entregador.corridas_aceitas, entregador.corridas_ofertadas),
      Rejeitadas: entregador.corridas_rejeitadas || 0,
      Completadas: entregador.corridas_completadas || 0,
      '% Completadas': calculateCompletionRate(entregador.corridas_completadas, entregador.corridas_aceitas),
      ['Ader\u00eancia']: normalizeMetricNumber(entregador.aderencia_percentual),
      ['Rejei\u00e7\u00e3o']: normalizeMetricNumber(entregador.rejeicao_percentual),
    })), 'Entregadores');

    appendSheet(XLSX, workbook, buildRankingRows(entregadores), 'Ranking');

    appendSheet(XLSX, workbook, diaOrigemRows.map((row) => ({
      Dia: row.dia || '-',
      Data: row.data || '-',
      Origem: row.origem || '-',
      Horas: formatarHorasParaHMS(normalizeMetricNumber(row.segundos_realizados) / 3600),
      Ofertadas: normalizeMetricNumber(row.corridas_ofertadas),
      Aceitas: normalizeMetricNumber(row.corridas_aceitas),
      '% Aceitas': calculateAcceptanceRate(row.corridas_aceitas, row.corridas_ofertadas),
      Rejeitadas: normalizeMetricNumber(row.corridas_rejeitadas),
      Completadas: normalizeMetricNumber(row.corridas_completadas),
      '% Completadas': calculateCompletionRate(row.corridas_completadas, row.corridas_aceitas),
      'Horas Planejadas': formatarHorasParaHMS(normalizeMetricNumber(row.segundos_planejados) / 3600),
      ['Ader\u00eancia']: normalizeMetricNumber(row.segundos_planejados) > 0 ? calculateHourlyAderencia(row.segundos_realizados, row.segundos_planejados) : 0,
    })), 'Dia x Origem');

    appendSheet(XLSX, workbook, formatFilters(rpcPayload), 'Filtros');

    const dataHora = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    XLSX.writeFile(workbook, `dedicado_${dataHora}.xlsx`);
  } catch (error) {
    safeLog.error('Erro ao exportar DEDICADO para Excel:', error);
    throw error instanceof Error ? error : new Error('Falha ao gerar Excel do DEDICADO.');
  }
}
