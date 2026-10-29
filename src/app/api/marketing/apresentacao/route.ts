import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE = 'https://api.g1.datacrazy.io/api/v1';
const PIPELINE_ID = '7fee98d6-7ee1-4bf3-a974-9ba9c73a661f';
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const CACHE_KEY = 'status-pipeline-v1';
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' };

type JsonRecord = Record<string, unknown>;
type LeadRow = {
  code: string;
  lead: string;
  phone: string;
  attendant: string;
  region: string;
  subregion: string;
  stage: string;
  stageOrder: number;
  sentDate: string | null;
  releasedDate: string | null;
  ranDate: string | null;
};
type CacheEntry = { data: { currentDate: string; leads: LeadRow[] }; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<{ currentDate: string; leads: LeadRow[] }>>();

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function getSaoPauloDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeDate(value: unknown): string | null {
  const text = asString(value);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const brazilian = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilian) return `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`;
  return null;
}

function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function normalizeRegion(value: string, subregion: string) {
  if (normalizeName(subregion).includes('tabo')) return 'Taboão da Serra';
  const normalized = normalizeName(value).replace(/\s*2\.0\s*$/, '').replace(/[.]/g, '').trim();
  const known = new Map([
    ['abc', 'ABC'],
    ['taboao da serra', 'Taboão da Serra'],
    ['guarulhos', 'Guarulhos'],
    ['sorocaba', 'Sorocaba'],
    ['salvador', 'Salvador'],
    ['sao paulo', 'São Paulo'],
    ['manaus', 'Manaus'],
  ]);
  return known.get(normalized) || value.trim() || 'Sem região';
}

function readLeadField(lead: JsonRecord, fieldName: string) {
  const rawFields = lead.additionalFields || lead.additional_fields;
  const fields = Array.isArray(rawFields) ? rawFields : [];
  const target = normalizeName(fieldName);
  const field = fields.find((item) => {
    const row = asRecord(item);
    const nested = asRecord(row.additionalField || row.additional_field || row.field);
    return normalizeName(asString(nested.name || row.name)) === target;
  });
  if (!field) return '';
  const row = asRecord(field);
  return asString(row.value ?? row.fieldValue ?? row.field_value);
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestData(path: string, params: Record<string, string>) {
  const apiKey = process.env.DATACRAZY_API_KEY?.trim();
  if (!apiKey) throw new Error('A integração DataCrazy ainda não está configurada no servidor.');

  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  let lastFailure: Error | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      });

      if (response.ok) {
        const payload = asRecord(await response.json());
        if (!Array.isArray(payload.data)) throw new Error('A resposta do DataCrazy veio em um formato inesperado.');
        return payload.data.map(asRecord);
      }

      if (response.status !== 429 && response.status < 500) {
        throw new Error(`DataCrazy recusou a consulta (HTTP ${response.status}).`);
      }

      lastFailure = new Error(`DataCrazy está temporariamente indisponível (HTTP ${response.status}).`);
      const retryAfter = Number(response.headers.get('retry-after'));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 20_000)
        : Math.min(1000 * (2 ** attempt), 16_000);
      if (attempt < 4) await wait(delayMs);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('DataCrazy recusou')) throw error;
      lastFailure = error instanceof Error ? error : new Error('Falha ao conectar ao DataCrazy.');
      if (attempt < 4) await wait(Math.min(1000 * (2 ** attempt), 16_000));
    }
  }

  throw lastFailure || new Error('Não foi possível consultar o DataCrazy.');
}

async function fetchAllPages(path: string, params: Record<string, string>) {
  const rows: JsonRecord[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await requestData(path, {
      ...params,
      take: String(PAGE_SIZE),
      skip: String(page * PAGE_SIZE),
    });
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
  throw new Error('O relatório excedeu o limite de registros por consulta.');
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const result = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      result[index] = await worker(items[index]);
    }
  }));
  return result;
}

function latestBusinessPerLead(businesses: JsonRecord[]) {
  const latest = new Map<string, JsonRecord>();
  for (const business of businesses) {
    const lead = asRecord(business.lead);
    const leadId = asString(business.leadId || business.lead_id || lead.id);
    if (!leadId) continue;
    const current = latest.get(leadId);
    if (!current || asString(business.lastMovedAt || business.last_moved_at) > asString(current.lastMovedAt || current.last_moved_at)) {
      latest.set(leadId, business);
    }
  }
  return latest;
}

async function fetchReport() {
  const stages = await requestData(`/pipelines/${PIPELINE_ID}/stages`, { take: '100' });
  stages.sort((left, right) => Number(left.index || 0) - Number(right.index || 0));
  if (stages.length === 0) throw new Error('A etapa Status não foi encontrada no DataCrazy.');

  const [businessesByStage, leads] = await Promise.all([
    mapWithConcurrency(stages, 3, (stage) => fetchAllPages('/businesses', {
      'filter[stages]': asString(stage.id),
    })),
    fetchAllPages('/leads', {
      'complete[additionalFields]': 'true',
      'filter[stages]': `some ${stages.map((stage) => asString(stage.id)).join(',')}`,
    }),
  ]);

  const stageOrder = new Map(stages.map((stage, index) => [asString(stage.id), Number(stage.index ?? index)]));
  const stageNames = new Map(stages.map((stage) => [asString(stage.id), asString(stage.name)]));
  const businessByLead = latestBusinessPerLead(businessesByStage.flat());
  const leadById = new Map(leads.map((lead) => [asString(lead.id), lead]));
  const currentDate = getSaoPauloDate();
  const periodStart = addDays(currentDate, -6);
  const ranStart = addDays(periodStart, -1);

  const rows: LeadRow[] = [];
  businessByLead.forEach((business, leadId) => {
    const lead = leadById.get(leadId) || asRecord(business.lead);
    const sentDate = normalizeDate(readLeadField(lead, 'DT A ENVIAR'));
    const releasedDate = normalizeDate(readLeadField(lead, 'LIBERADO DIA'));
    const ranDate = normalizeDate(readLeadField(lead, 'RODOU DIA'));
    const isInReportPeriod = Boolean(
      (sentDate && sentDate >= periodStart && sentDate <= currentDate)
      || (releasedDate && releasedDate >= periodStart && releasedDate <= currentDate)
      || (ranDate && ranDate >= ranStart && ranDate <= currentDate),
    );
    if (!isInReportPeriod) return;

    const subregion = readLeadField(lead, 'Subpraça');
    const stage = asRecord(business.stage);
    const stageId = asString(business.stageId || business.stage_id || stage.id);
    const attendant = asRecord(business.attendant || business.assignedAttendant || business.assigned_attendant);
    const name = asString(lead.name || lead.fullName || lead.full_name);
    const code = asString(business.code || business.businessCode || business.business_code);

    rows.push({
      code,
      lead: name || 'Sem nome',
      phone: asString(lead.phone || lead.mobilePhone || lead.mobile_phone),
      attendant: asString(attendant.name || business.attendantName || business.attendant_name) || 'Sem atendente',
      region: normalizeRegion(readLeadField(lead, 'Regiões'), subregion),
      subregion,
      stage: asString(stage.name) || stageNames.get(stageId) || 'Sem etapa',
      stageOrder: stageOrder.get(stageId) ?? 99,
      sentDate,
      releasedDate,
      ranDate,
    });
  });

  rows.sort((left, right) => left.stageOrder - right.stageOrder
    || left.attendant.localeCompare(right.attendant, 'pt-BR')
    || left.lead.localeCompare(right.lead, 'pt-BR'));

  return { currentDate, leads: rows };
}

async function getCachedReport() {
  const existingRequest = inFlight.get(CACHE_KEY);
  if (existingRequest) return existingRequest;

  const request = fetchReport().then((data) => {
    cache.set(CACHE_KEY, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }).finally(() => {
    if (inFlight.get(CACHE_KEY) === request) inFlight.delete(CACHE_KEY);
  });
  inFlight.set(CACHE_KEY, request);
  return request;
}

export async function GET(request: Request) {
  try {
    const auth = await loadCurrentUserProfile({
      requireApproved: true,
      notApprovedMessage: 'Usuário ainda não aprovado.',
    });
    if ('failure' in auth) {
      return privateJson({ data: null, error: auth.failure.message }, auth.failure.status);
    }

    const role = String(auth.profile.role || '').toLowerCase();
    if (!hasElevatedRole(auth.profile) && role !== 'marketing') {
      return privateJson({ data: null, error: 'Esta apresentação é restrita ao time de Marketing.' }, 403);
    }

    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';
    const cached = cache.get(CACHE_KEY);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return privateJson({ data: cached.data, error: null, cached: true });
    }

    try {
      const data = await getCachedReport();
      return privateJson({ data, error: null, cached: false });
    } catch (error) {
      if (cached && Date.now() - cached.expiresAt < CACHE_MAX_AGE_MS) {
        return privateJson({ data: cached.data, error: null, cached: true, stale: true });
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar os dados do DataCrazy.';
    return privateJson({ data: null, error: message }, 502);
  }
}
