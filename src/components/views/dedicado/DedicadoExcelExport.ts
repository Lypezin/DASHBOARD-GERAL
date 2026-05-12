import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { loadXLSX } from '@/lib/xlsxClient';
import { RPC_TIMEOUTS } from '@/constants/config';
import { formatarHorasParaHMS } from '@/utils/formatters';
import type { Entregador } from '@/types';
import type { FilterPayload } from '@/types/filters';

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

function normalizeNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value: unknown) {
  return `${normalizeNumber(value).toFixed(1)}%`;
}

function calculateHourlyAderencia(realizados: unknown, planejados: unknown) {
  const totalPlanejados = normalizeNumber(planejados);
  if (totalPlanejados <= 0) return 0;
  return (normalizeNumber(realizados) / totalPlanejados) * 100;
}

function calculateAcceptanceRate(aceitas: unknown, ofertadas: unknown) {
  const totalOfertadas = normalizeNumber(ofertadas);
  if (totalOfertadas <= 0) return 0;
  return (normalizeNumber(aceitas) / totalOfertadas) * 100;
}

function calculateCompletionRate(completadas: unknown, aceitas: unknown) {
  const totalAceitas = normalizeNumber(aceitas);
  if (totalAceitas <= 0) return 0;
  return (normalizeNumber(completadas) / totalAceitas) * 100;
}

function formatPercentOrDash(value: unknown, hasBase: boolean) {
  return hasBase ? formatPercent(value) : '-';
}

function buildRpcPayload(filterPayload: FilterPayload) {
  const allowed = ['p_ano', 'p_semana', 'p_semanas', 'p_praca', 'p_sub_praca', 'p_data_inicial', 'p_data_final', 'p_organization_id'] as const;
  const payload: Record<string, unknown> = {};

  allowed.forEach((key) => {
    const value = filterPayload[key];
    if (value !== null && value !== undefined && value !== '') {
      payload[key] = value;
    }
  });

  return payload;
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
    const rpcPayload = buildRpcPayload(filterPayload);
    const XLSX = await loadXLSX();
    const workbook = XLSX.utils.book_new();

    const [summaryResult, entregadoresResult] = await Promise.all([
      safeRpc<DedicadoExportPayload>('dashboard_dedicado_origens_v2', {
        ...rpcPayload,
        p_include_dia_origem: true,
      }, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false,
      }),
      safeRpc<DedicadoEntregadoresPayload>('listar_entregadores_origens_v2', rpcPayload, {
        timeout: RPC_TIMEOUTS.LONG,
        validateParams: false,
      }),
    ]);

    if (summaryResult.error) throw new Error(summaryResult.error.message || 'Erro ao buscar resumo do DEDICADO');
    if (entregadoresResult.error) throw new Error(entregadoresResult.error.message || 'Erro ao buscar entregadores do DEDICADO');

    const totals = summaryResult.data?.totais || {};
    const origemRows = Array.isArray(summaryResult.data?.origem) ? summaryResult.data.origem : [];
    const diaOrigemRows = Array.isArray(summaryResult.data?.dia_origem) ? summaryResult.data.dia_origem : [];
    const entregadores = Array.isArray(entregadoresResult.data?.entregadores) ? entregadoresResult.data.entregadores : [];

    appendSheet(XLSX, workbook, [
      { Indicador: 'Entregadores', Valor: normalizeNumber(totals.total_entregadores) },
      { Indicador: 'Origens', Valor: normalizeNumber(totals.total_origens) },
      { Indicador: 'Ofertadas', Valor: normalizeNumber(totals.corridas_ofertadas) },
      { Indicador: 'Aceitas', Valor: normalizeNumber(totals.corridas_aceitas) },
      { Indicador: 'Rejeitadas', Valor: normalizeNumber(totals.corridas_rejeitadas) },
      { Indicador: 'Completadas', Valor: normalizeNumber(totals.corridas_completadas) },
      { Indicador: 'Horas', Valor: formatarHorasParaHMS(normalizeNumber(totals.segundos_realizados) / 3600) },
      { Indicador: 'Horas Planejadas', Valor: formatarHorasParaHMS(normalizeNumber(totals.segundos_planejados) / 3600) },
      { Indicador: 'Aderencia Horas', Valor: formatPercentOrDash(calculateHourlyAderencia(totals.segundos_realizados, totals.segundos_planejados), normalizeNumber(totals.segundos_planejados) > 0) },
    ], 'Resumo');

    appendSheet(XLSX, workbook, origemRows.map((row) => ({
      Origem: row.origem || '-',
      Horas: formatarHorasParaHMS(normalizeNumber(row.segundos_realizados) / 3600),
      Ofertadas: normalizeNumber(row.corridas_ofertadas),
      Aceitas: normalizeNumber(row.corridas_aceitas),
      '% Aceitas': formatPercent(calculateAcceptanceRate(row.corridas_aceitas, row.corridas_ofertadas)),
      Rejeitadas: normalizeNumber(row.corridas_rejeitadas),
      Completadas: normalizeNumber(row.corridas_completadas),
      '% Completadas': formatPercent(calculateCompletionRate(row.corridas_completadas, row.corridas_aceitas)),
      'Horas Planejadas': formatarHorasParaHMS(normalizeNumber(row.segundos_planejados) / 3600),
      Aderencia: formatPercentOrDash(calculateHourlyAderencia(row.segundos_realizados, row.segundos_planejados), normalizeNumber(row.segundos_planejados) > 0),
    })), 'Origens');

    appendSheet(XLSX, workbook, entregadores.map((entregador) => ({
      'ID Entregador': entregador.id_entregador,
      Nome: entregador.nome_entregador,
      Horas: formatarHorasParaHMS((entregador.total_segundos || 0) / 3600),
      Ofertadas: entregador.corridas_ofertadas || 0,
      Aceitas: entregador.corridas_aceitas || 0,
      '% Aceitas': formatPercent(calculateAcceptanceRate(entregador.corridas_aceitas, entregador.corridas_ofertadas)),
      Rejeitadas: entregador.corridas_rejeitadas || 0,
      Completadas: entregador.corridas_completadas || 0,
      '% Completadas': formatPercent(calculateCompletionRate(entregador.corridas_completadas, entregador.corridas_aceitas)),
      Aderencia: formatPercent(entregador.aderencia_percentual),
      Rejeicao: formatPercent(entregador.rejeicao_percentual),
    })), 'Entregadores');

    appendSheet(XLSX, workbook, diaOrigemRows.map((row) => ({
      Dia: row.dia || '-',
      Data: row.data || '-',
      Origem: row.origem || '-',
      Horas: formatarHorasParaHMS(normalizeNumber(row.segundos_realizados) / 3600),
      Ofertadas: normalizeNumber(row.corridas_ofertadas),
      Aceitas: normalizeNumber(row.corridas_aceitas),
      '% Aceitas': formatPercent(calculateAcceptanceRate(row.corridas_aceitas, row.corridas_ofertadas)),
      Rejeitadas: normalizeNumber(row.corridas_rejeitadas),
      Completadas: normalizeNumber(row.corridas_completadas),
      '% Completadas': formatPercent(calculateCompletionRate(row.corridas_completadas, row.corridas_aceitas)),
      'Horas Planejadas': formatarHorasParaHMS(normalizeNumber(row.segundos_planejados) / 3600),
      Aderencia: formatPercentOrDash(calculateHourlyAderencia(row.segundos_realizados, row.segundos_planejados), normalizeNumber(row.segundos_planejados) > 0),
    })), 'Dia x Origem');

    appendSheet(XLSX, workbook, formatFilters(rpcPayload), 'Filtros');

    const dataHora = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    XLSX.writeFile(workbook, `dedicado_${dataHora}.xlsx`);
  } catch (error) {
    safeLog.error('Erro ao exportar DEDICADO para Excel:', error);
    throw new Error('Falha ao gerar Excel do DEDICADO.');
  }
}
