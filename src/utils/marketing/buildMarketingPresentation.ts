import type { SupabaseClient } from '@supabase/supabase-js';
import type { MarketingCostData, MarketingCostsComparison, MarketingCityData } from '@/types';
import { fetchAllMarketingRows } from '@/utils/marketing/fetchers/queryErrors';

export type MarketingPresentationLead = {
  code: string;
  lead: string;
  phone: string;
  attendant: string;
  region: string;
  subregion: string;
  stage: string;
  stageOrder: number;
  createdDate: string | null;
  sentDate: string | null;
  releasedDate: string | null;
  ranDate: string | null;
};

export type MarketingPresentationWeek = {
  semana: string;
  criado: number;
  enviado: number;
  liberado: number;
  rodando: number;
  conversas: number;
};

export type MarketingPresentationReport = {
  reportDate: string;
  monthStart: string;
  monthEnd: string;
  weekStart: string;
  weekEnd: string;
  trafficCurrentStart: string;
  trafficCurrentEnd: string;
  trafficPreviousStart: string;
  trafficPreviousEnd: string;
  scannedAt: string;
  citiesData: MarketingCityData[];
  evolutionData: Array<{ data: string; liberado: number; enviado: number }>;
  weeklyData: MarketingPresentationWeek[];
  weeklyDataByCity: Array<{ cidade: string; data: MarketingPresentationWeek[] }>;
  costsComparison: MarketingCostsComparison;
  dataNote: string;
};

const PRIMARY_REGIONS = ['São Paulo', 'Guarulhos', 'Manaus', 'ABC', 'Sorocaba', 'Salvador', 'Taboão da Serra'];
const FIRST_WEEK_OFFSET = 7;

function shiftDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekStartFor(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function monthStartFor(isoDate: string) {
  return `${isoDate.slice(0, 7)}-01`;
}

function lastMondayOnOrBefore(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function datesBetween(start: string, end: string) {
  if (end < start) return [];
  const dates: string[] = [];
  for (let date = start; date <= end; date = shiftDate(date, 1)) dates.push(date);
  return dates;
}

function inRange(value: string | null, start: string, end: string) {
  return Boolean(value && value >= start && value <= end);
}

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeRegion(value: string) {
  const key = normalized(value).replace(/\s*2\.0\s*$/, '');
  if (!key) return 'Sem região';
  if (key.includes('taboao') || key.includes('embu')) return 'Taboão da Serra';
  if (key === 'abc' || key.includes('santo andre') || key.includes('sao bernardo')) return 'ABC';
  const known = new Map([
    ['sao paulo', 'São Paulo'],
    ['guarulhos', 'Guarulhos'],
    ['manaus', 'Manaus'],
    ['sorocaba', 'Sorocaba'],
    ['salvador', 'Salvador'],
  ]);
  return known.get(key) || value.trim() || 'Sem região';
}

function getWeekNumber(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function isOpenStage(stage: string) {
  const value = normalized(stage);
  return value.includes('aberto') || value.includes('a enviar') || value.includes('aguardando') || value.includes('confirmar');
}

function isReturnedStage(stage: string) {
  const value = normalized(stage);
  return value.includes('voltou') || value.includes('desistiu') || value.includes('bug');
}

function sumLeadMetrics(leads: MarketingPresentationLead[], start: string, end: string) {
  const created = leads.filter((lead) => inRange(lead.createdDate, start, end)).length;
  const sent = leads.filter((lead) => inRange(lead.sentDate, start, end)).length;
  const released = leads.filter((lead) => inRange(lead.releasedDate, start, end)).length;
  const ran = leads.filter((lead) => inRange(lead.ranDate, start, end)).length;
  const open = leads.filter((lead) => inRange(lead.sentDate, start, end) && isOpenStage(lead.stage)).length;
  const returned = leads.filter((lead) => inRange(lead.sentDate, start, end) && isReturnedStage(lead.stage)).length;
  return { created, sent, released, ran, open, returned };
}

async function loadImportedCosts(
  start: string,
  end: string,
  organizationId: string | null,
  client: SupabaseClient,
) {
  return fetchAllMarketingRows('Erro ao carregar os custos importados da planilha.', (from, to, includeExactCount) => {
    let query = client.from('dados_valores_cidade').select(
      'id, data, valor, cidade, organization_id, conversas',
      includeExactCount ? { count: 'exact' } : undefined,
    ).gte('data', start).lte('data', end);
    if (organizationId) query = query.eq('organization_id', organizationId);
    return query.order('id', { ascending: true }).range(from, to);
  });
}

function sumCostsForRegion(rows: any[], region: string) {
  return rows.reduce((totals, row) => {
    if (normalizeRegion(String(row.cidade || '')) !== region) return totals;
    totals.value += Number(row.valor) || 0;
    totals.conversations += Number(row.conversas) || 0;
    return totals;
  }, { value: 0, conversations: 0 });
}

function buildCostsForRange(
  leads: MarketingPresentationLead[],
  costRows: any[],
  start: string,
  end: string,
): MarketingCostData[] {
  if (end < start) return [];
  const activeLeads = leads.filter((lead) => inRange(lead.sentDate, start, end) || inRange(lead.releasedDate, start, end) || inRange(lead.ranDate, start, end));
  const regions = new Set([
    ...PRIMARY_REGIONS,
    ...activeLeads.map((lead) => normalizeRegion(lead.region)),
    ...costRows.map((row) => normalizeRegion(String(row.cidade || ''))),
  ]);

  return [...regions]
    .map((region) => {
      const metrics = sumLeadMetrics(activeLeads.filter((lead) => normalizeRegion(lead.region) === region), start, end);
      const costs = sumCostsForRegion(costRows, region);
      return {
        regiao: region,
        valorUsado: costs.value,
        rodando: metrics.ran,
        liberado: metrics.released,
        aberto: metrics.open,
        cpa: metrics.ran > 0 ? costs.value / metrics.ran : 0,
        conversas: costs.conversations,
      };
    })
    .filter((item) => item.valorUsado > 0 || item.conversas > 0 || item.rodando > 0 || item.liberado > 0 || item.aberto > 0)
    .sort((left, right) => {
      const leftIndex = PRIMARY_REGIONS.indexOf(left.regiao);
      const rightIndex = PRIMARY_REGIONS.indexOf(right.regiao);
      return (leftIndex < 0 ? PRIMARY_REGIONS.length : leftIndex) - (rightIndex < 0 ? PRIMARY_REGIONS.length : rightIndex)
        || left.regiao.localeCompare(right.regiao, 'pt-BR');
    });
}

export async function buildMarketingPresentation(
  leads: MarketingPresentationLead[],
  scannedAt: string,
  reportDate: string,
  organizationId: string | null,
  client: SupabaseClient,
): Promise<MarketingPresentationReport> {
  const monthStart = monthStartFor(reportDate);
  const monthEnd = shiftDate(reportDate, -1);
  const weekStart = weekStartFor(monthEnd);
  const calendarWeekEnd = shiftDate(weekStart, 6);
  const weekEnd = calendarWeekEnd < monthEnd ? calendarWeekEnd : monthEnd;
  const comparisonStart = shiftDate(weekStart, -FIRST_WEEK_OFFSET * 7);
  const trafficCurrentStart = monthStart;
  const trafficCurrentEnd = monthEnd;
  const trafficPreviousStart = monthStart;
  const trafficPreviousEnd = lastMondayOnOrBefore(monthEnd);
  const costsQueryStart = comparisonStart < monthStart ? comparisonStart : monthStart;
  const costRows = await loadImportedCosts(costsQueryStart, monthEnd, organizationId, client);
  const monthCostRows = costRows.filter((row: any) => {
    const date = String(row.data || '').slice(0, 10);
    return date >= monthStart && date <= monthEnd;
  });
  const cities = new Set([
    ...PRIMARY_REGIONS,
    ...leads.filter((lead) => inRange(lead.createdDate, comparisonStart, weekEnd)
      || inRange(lead.sentDate, comparisonStart, weekEnd)
      || inRange(lead.releasedDate, comparisonStart, weekEnd)
      || inRange(lead.ranDate, comparisonStart, weekEnd))
      .map((lead) => normalizeRegion(lead.region)),
    ...costRows.map((row: any) => normalizeRegion(String(row.cidade || ''))),
  ]);
  const orderedCities = [...cities].sort((left, right) => {
    const leftIndex = PRIMARY_REGIONS.indexOf(left);
    const rightIndex = PRIMARY_REGIONS.indexOf(right);
    return (leftIndex < 0 ? PRIMARY_REGIONS.length : leftIndex) - (rightIndex < 0 ? PRIMARY_REGIONS.length : rightIndex)
      || left.localeCompare(right, 'pt-BR');
  });

  const weeks = Array.from({ length: FIRST_WEEK_OFFSET + 1 }, (_, index) => {
    const start = shiftDate(weekStart, (index - FIRST_WEEK_OFFSET) * 7);
    const calendarWeekEnd = shiftDate(start, 6);
    const end = calendarWeekEnd < monthEnd ? calendarWeekEnd : monthEnd;
    const weekLeads = leads.filter((lead) => inRange(lead.createdDate, start, end)
      || inRange(lead.sentDate, start, end)
      || inRange(lead.releasedDate, start, end)
      || inRange(lead.ranDate, start, end));
    const metrics = sumLeadMetrics(weekLeads, start, end);
    const conversations = costRows.reduce((sum: number, row: any) => {
      const date = String(row.data || '').slice(0, 10);
      return date >= start && date <= end ? sum + (Number(row.conversas) || 0) : sum;
    }, 0);
    return {
      start,
      end,
      rows: weekLeads,
      data: {
        semana: `Semana ${String(getWeekNumber(start)).padStart(2, '0')}`,
        criado: metrics.created,
        enviado: metrics.sent,
        liberado: metrics.released,
        rodando: metrics.ran,
        conversas: conversations,
      },
    };
  });

  const monthLeads = leads.filter((lead) => inRange(lead.createdDate, monthStart, monthEnd)
    || inRange(lead.sentDate, monthStart, monthEnd)
    || inRange(lead.releasedDate, monthStart, monthEnd)
    || inRange(lead.ranDate, monthStart, monthEnd));
  const citiesData: MarketingCityData[] = orderedCities.map((cidade) => {
    const cityLeads = monthLeads.filter((lead) => normalizeRegion(lead.region) === cidade);
    const metrics = sumLeadMetrics(cityLeads, monthStart, monthEnd);
    return {
      cidade,
      criado: metrics.created,
      enviado: metrics.sent,
      liberado: metrics.released,
      rodandoInicio: metrics.ran,
      aberto: metrics.open,
      voltou: metrics.returned,
      conversas: 0,
    };
  }).filter((city) => city.criado || city.enviado || city.liberado || city.rodandoInicio || city.aberto || city.voltou);

  const evolutionData = datesBetween(monthStart, monthEnd).map((date) => {
    return {
      data: date,
      liberado: monthLeads.filter((lead) => lead.releasedDate === date).length,
      enviado: monthLeads.filter((lead) => lead.sentDate === date).length,
    };
  });

  const weeklyData = weeks.map((week) => week.data);
  const weeklyDataByCity = orderedCities.map((cidade) => ({
    cidade,
    data: weeks.map((week) => {
      const cityRows = week.rows.filter((lead) => normalizeRegion(lead.region) === cidade);
      const metrics = sumLeadMetrics(cityRows, week.start, week.end);
      const conversations = costRows.reduce((sum: number, row: any) => {
        const date = String(row.data || '').slice(0, 10);
        return date >= week.start && date <= week.end && normalizeRegion(String(row.cidade || '')) === cidade
          ? sum + (Number(row.conversas) || 0)
          : sum;
      }, 0);
      return {
        semana: week.data.semana,
        criado: metrics.created,
        enviado: metrics.sent,
        liberado: metrics.released,
        rodando: metrics.ran,
        conversas: conversations,
      };
    }),
  })).filter((city) => city.data.some((week) => week.criado || week.enviado || week.liberado || week.rodando || week.conversas));

  const costsComparison: MarketingCostsComparison = {
    atual: buildCostsForRange(leads, monthCostRows.filter((row: any) => String(row.data || '').slice(0, 10) <= trafficCurrentEnd), trafficCurrentStart, trafficCurrentEnd),
    passada: buildCostsForRange(leads, monthCostRows.filter((row: any) => String(row.data || '').slice(0, 10) <= trafficPreviousEnd), trafficPreviousStart, trafficPreviousEnd),
  };

  const scannedDateLabel = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${scannedAt}T12:00:00.000Z`));
  return {
    reportDate,
    monthStart,
    monthEnd,
    weekStart,
    weekEnd,
    trafficCurrentStart,
    trafficCurrentEnd,
    trafficPreviousStart,
    trafficPreviousEnd,
    scannedAt,
    citiesData,
    evolutionData,
    weeklyData,
    weeklyDataByCity,
    costsComparison,
    dataNote: `“Doc. coletado” corresponde à data de criação do lead. Eventos agrupados pelas datas registradas. As etapas “em aberto” e “voltou” refletem o estágio atual no DataCrazy, consultado em ${scannedDateLabel}. Custos e conversas vêm da planilha importada.`,
  };
}
