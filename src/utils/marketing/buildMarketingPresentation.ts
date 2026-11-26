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
const PRIMARY_REGION_INDEX = new Map(PRIMARY_REGIONS.map((region, index) => [region, index]));
const KNOWN_REGIONS = new Map([
  ['sao paulo', 'São Paulo'],
  ['guarulhos', 'Guarulhos'],
  ['manaus', 'Manaus'],
  ['sorocaba', 'Sorocaba'],
  ['salvador', 'Salvador'],
]);
const SCANNED_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
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
  return KNOWN_REGIONS.get(key) || value.trim() || 'Sem região';
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

type PreparedPresentationLead = MarketingPresentationLead & {
  normalizedRegion: string;
  isOpen: boolean;
  isReturned: boolean;
};

type LeadMetricsBucket = {
  created: number;
  sent: number;
  released: number;
  ran: number;
  open: number;
  returned: number;
};

function createEmptyMetrics(): LeadMetricsBucket {
  return { created: 0, sent: 0, released: 0, ran: 0, open: 0, returned: 0 };
}

function accumulateLeadIntoBucket(bucket: LeadMetricsBucket, lead: PreparedPresentationLead, start: string, end: string) {
  if (inRange(lead.createdDate, start, end)) bucket.created += 1;
  if (inRange(lead.sentDate, start, end)) {
    bucket.sent += 1;
    if (lead.isOpen) bucket.open += 1;
    if (lead.isReturned) bucket.returned += 1;
  }
  if (inRange(lead.releasedDate, start, end)) bucket.released += 1;
  if (inRange(lead.ranDate, start, end)) bucket.ran += 1;
}

function compareRegions(left: string, right: string) {
  const leftIndex = PRIMARY_REGION_INDEX.get(left) ?? PRIMARY_REGIONS.length;
  const rightIndex = PRIMARY_REGION_INDEX.get(right) ?? PRIMARY_REGIONS.length;
  return leftIndex - rightIndex || left.localeCompare(right, 'pt-BR');
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

type PreparedCostRow = {
  date: string;
  region: string;
  value: number;
  conversations: number;
};

function buildCostsForRange(
  leads: PreparedPresentationLead[],
  costRows: PreparedCostRow[],
  start: string,
  end: string,
): MarketingCostData[] {
  if (end < start) return [];

  const regions = new Set<string>(PRIMARY_REGIONS);
  const metricsByRegion = new Map<string, LeadMetricsBucket>();
  const costsByRegion = new Map<string, { value: number; conversations: number }>();

  for (const lead of leads) {
    if (!inRange(lead.sentDate, start, end) && !inRange(lead.releasedDate, start, end) && !inRange(lead.ranDate, start, end)) {
      continue;
    }
    regions.add(lead.normalizedRegion);
    let bucket = metricsByRegion.get(lead.normalizedRegion);
    if (!bucket) {
      bucket = createEmptyMetrics();
      metricsByRegion.set(lead.normalizedRegion, bucket);
    }
    accumulateLeadIntoBucket(bucket, lead, start, end);
  }

  for (const row of costRows) {
    if (row.date > end) continue;
    regions.add(row.region);
    const existing = costsByRegion.get(row.region);
    if (existing) {
      existing.value += row.value;
      existing.conversations += row.conversations;
    } else {
      costsByRegion.set(row.region, { value: row.value, conversations: row.conversations });
    }
  }

  return [...regions]
    .map((region) => {
      const metrics = metricsByRegion.get(region) ?? createEmptyMetrics();
      const costs = costsByRegion.get(region) ?? { value: 0, conversations: 0 };
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
    .sort((left, right) => compareRegions(left.regiao, right.regiao));
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

  const regionCache = new Map<string, string>();
  const resolveRegion = (raw: string) => {
    let resolved = regionCache.get(raw);
    if (!resolved) {
      resolved = normalizeRegion(raw);
      regionCache.set(raw, resolved);
    }
    return resolved;
  };

  const preparedLeads: PreparedPresentationLead[] = leads.map((lead) => ({
    ...lead,
    normalizedRegion: resolveRegion(lead.region),
    isOpen: isOpenStage(lead.stage),
    isReturned: isReturnedStage(lead.stage),
  }));

  const rawCostRows = await loadImportedCosts(costsQueryStart, monthEnd, organizationId, client);
  const preparedCostRows: PreparedCostRow[] = rawCostRows.map((row: any) => ({
    date: String(row.data || '').slice(0, 10),
    region: resolveRegion(String(row.cidade || '')),
    value: Number(row.valor) || 0,
    conversations: Number(row.conversas) || 0,
  }));
  const monthCostRows = preparedCostRows.filter((row) => row.date >= monthStart && row.date <= monthEnd);

  const cities = new Set<string>(PRIMARY_REGIONS);
  for (const lead of preparedLeads) {
    if (
      inRange(lead.createdDate, comparisonStart, weekEnd)
      || inRange(lead.sentDate, comparisonStart, weekEnd)
      || inRange(lead.releasedDate, comparisonStart, weekEnd)
      || inRange(lead.ranDate, comparisonStart, weekEnd)
    ) {
      cities.add(lead.normalizedRegion);
    }
  }
  for (const row of preparedCostRows) {
    cities.add(row.region);
  }
  const orderedCities = [...cities].sort(compareRegions);

  const weeks = Array.from({ length: FIRST_WEEK_OFFSET + 1 }, (_, index) => {
    const start = shiftDate(weekStart, (index - FIRST_WEEK_OFFSET) * 7);
    const calendarEnd = shiftDate(start, 6);
    const end = calendarEnd < monthEnd ? calendarEnd : monthEnd;
    const totalMetrics = createEmptyMetrics();
    const metricsByCity = new Map<string, LeadMetricsBucket>();
    const conversationsByCity = new Map<string, number>();
    let totalConversations = 0;

    for (const lead of preparedLeads) {
      const inWeek = inRange(lead.createdDate, start, end)
        || inRange(lead.sentDate, start, end)
        || inRange(lead.releasedDate, start, end)
        || inRange(lead.ranDate, start, end);
      if (!inWeek) continue;

      accumulateLeadIntoBucket(totalMetrics, lead, start, end);
      let cityBucket = metricsByCity.get(lead.normalizedRegion);
      if (!cityBucket) {
        cityBucket = createEmptyMetrics();
        metricsByCity.set(lead.normalizedRegion, cityBucket);
      }
      accumulateLeadIntoBucket(cityBucket, lead, start, end);
    }

    for (const row of preparedCostRows) {
      if (row.date >= start && row.date <= end) {
        totalConversations += row.conversations;
        conversationsByCity.set(row.region, (conversationsByCity.get(row.region) ?? 0) + row.conversations);
      }
    }

    return {
      metricsByCity,
      conversationsByCity,
      data: {
        semana: `Semana ${String(getWeekNumber(start)).padStart(2, '0')}`,
        criado: totalMetrics.created,
        enviado: totalMetrics.sent,
        liberado: totalMetrics.released,
        rodando: totalMetrics.ran,
        conversas: totalConversations,
      },
    };
  });

  const monthMetricsByCity = new Map<string, LeadMetricsBucket>();
  const dailyEvolutionMap = new Map<string, { liberado: number; enviado: number }>();

  for (const lead of preparedLeads) {
    const inMonth = inRange(lead.createdDate, monthStart, monthEnd)
      || inRange(lead.sentDate, monthStart, monthEnd)
      || inRange(lead.releasedDate, monthStart, monthEnd)
      || inRange(lead.ranDate, monthStart, monthEnd);
    if (!inMonth) continue;

    let cityBucket = monthMetricsByCity.get(lead.normalizedRegion);
    if (!cityBucket) {
      cityBucket = createEmptyMetrics();
      monthMetricsByCity.set(lead.normalizedRegion, cityBucket);
    }
    accumulateLeadIntoBucket(cityBucket, lead, monthStart, monthEnd);

    if (lead.releasedDate && lead.releasedDate >= monthStart && lead.releasedDate <= monthEnd) {
      const entry = dailyEvolutionMap.get(lead.releasedDate) || { liberado: 0, enviado: 0 };
      entry.liberado += 1;
      dailyEvolutionMap.set(lead.releasedDate, entry);
    }
    if (lead.sentDate && lead.sentDate >= monthStart && lead.sentDate <= monthEnd) {
      const entry = dailyEvolutionMap.get(lead.sentDate) || { liberado: 0, enviado: 0 };
      entry.enviado += 1;
      dailyEvolutionMap.set(lead.sentDate, entry);
    }
  }

  const citiesData: MarketingCityData[] = orderedCities.map((cidade) => {
    const metrics = monthMetricsByCity.get(cidade) ?? createEmptyMetrics();
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
    const entry = dailyEvolutionMap.get(date);
    return {
      data: date,
      liberado: entry?.liberado ?? 0,
      enviado: entry?.enviado ?? 0,
    };
  });

  const weeklyData = weeks.map((week) => week.data);
  const weeklyDataByCity = orderedCities.map((cidade) => ({
    cidade,
    data: weeks.map((week) => {
      const metrics = week.metricsByCity.get(cidade) ?? createEmptyMetrics();
      return {
        semana: week.data.semana,
        criado: metrics.created,
        enviado: metrics.sent,
        liberado: metrics.released,
        rodando: metrics.ran,
        conversas: week.conversationsByCity.get(cidade) ?? 0,
      };
    }),
  })).filter((city) => city.data.some((week) => week.criado || week.enviado || week.liberado || week.rodando || week.conversas));

  const costsComparison: MarketingCostsComparison = {
    atual: buildCostsForRange(preparedLeads, monthCostRows, trafficCurrentStart, trafficCurrentEnd),
    passada: buildCostsForRange(preparedLeads, monthCostRows, trafficPreviousStart, trafficPreviousEnd),
  };

  const scannedDateLabel = SCANNED_DATE_FORMATTER.format(new Date(`${scannedAt}T12:00:00.000Z`));
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
