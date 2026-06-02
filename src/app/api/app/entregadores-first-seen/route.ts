import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 15000;
const AGGREGATE_CHUNK_SIZE = 180;
const FALLBACK_CONCURRENCY = 8;

type FirstSeenBody = {
  entregadorIds?: unknown;
  organizationId?: unknown;
};

type FirstSeenRow = {
  id_entregador: string;
  primeira_data_aparicao: string | null;
};

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeEntregadorIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const item of value) {
    const id = normalizeString(item, 120);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_IDS) break;
  }

  return ids;
}

function normalizeAssignedPracas(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function hasFullCityAccess(profile: Parameters<typeof hasElevatedRole>[0]) {
  const role = String(profile.role || '').toLowerCase();
  return hasElevatedRole(profile) || role === 'marketing';
}

function resolveOrganizationId(body: FirstSeenBody | null, profileOrganizationId?: string | null, canUseRequestedOrg = false) {
  const requestedOrganizationId = normalizeString(body?.organizationId, 120);
  const safeRequestedOrganizationId = requestedOrganizationId && UUID_RE.test(requestedOrganizationId)
    ? requestedOrganizationId
    : null;

  if (canUseRequestedOrg && safeRequestedOrganizationId) {
    return safeRequestedOrganizationId;
  }

  return profileOrganizationId && UUID_RE.test(profileOrganizationId)
    ? profileOrganizationId
    : null;
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function readFirstSeenDate(row: Record<string, unknown>) {
  const value = row.primeira_data_aparicao ?? row.min ?? row.data_do_periodo;
  return typeof value === 'string' && value ? value : null;
}

async function fetchFirstSeenAggregate(
  supabase: ReturnType<typeof createServiceRoleClient>,
  ids: string[],
  organizationId: string | null,
  allowedPracas: string[] | null,
) {
  const result = new Map<string, string | null>();

  for (const chunk of chunkArray(ids, AGGREGATE_CHUNK_SIZE)) {
    let query = supabase
      .from('dados_corridas')
      .select('id_da_pessoa_entregadora, data_do_periodo.min()')
      .in('id_da_pessoa_entregadora', chunk)
      .not('data_do_periodo', 'is', null);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (allowedPracas) {
      query = query.in('praca', allowedPracas);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    for (const row of data || []) {
      const id = normalizeString(row.id_da_pessoa_entregadora, 120);
      if (id) result.set(id, readFirstSeenDate(row as Record<string, unknown>));
    }
  }

  return result;
}

async function fetchOneFirstSeen(
  supabase: ReturnType<typeof createServiceRoleClient>,
  id: string,
  organizationId: string | null,
  allowedPracas: string[] | null,
) {
  let query = supabase
    .from('dados_corridas')
    .select('data_do_periodo')
    .eq('id_da_pessoa_entregadora', id)
    .not('data_do_periodo', 'is', null);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (allowedPracas) {
    query = query.in('praca', allowedPracas);
  }

  const { data, error } = await query
    .order('data_do_periodo', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.data_do_periodo === 'string' ? data.data_do_periodo : null;
}

async function fetchFirstSeenFallback(
  supabase: ReturnType<typeof createServiceRoleClient>,
  ids: string[],
  organizationId: string | null,
  allowedPracas: string[] | null,
) {
  const result = new Map<string, string | null>();
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < ids.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      const id = ids[currentIndex];
      if (!id) continue;

      const firstSeen = await fetchOneFirstSeen(supabase, id, organizationId, allowedPracas);
      result.set(id, firstSeen);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FALLBACK_CONCURRENCY, ids.length) }, () => worker())
  );

  return result;
}

export async function POST(request: Request) {
  const auth = await loadCurrentUserProfile({ requireApproved: true });
  if ('failure' in auth) {
    return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
  }

  const body = await request.json().catch(() => null) as FirstSeenBody | null;
  const entregadorIds = normalizeEntregadorIds(body?.entregadorIds);

  if (entregadorIds.length === 0) {
    return NextResponse.json({ data: [], error: null });
  }

  const fullCityAccess = hasFullCityAccess(auth.profile);
  const organizationId = resolveOrganizationId(body, auth.profile.organization_id, fullCityAccess);

  const assignedPracas = normalizeAssignedPracas(auth.profile.assigned_pracas);
  const allowedPracas = fullCityAccess ? null : assignedPracas;

  if (!fullCityAccess && !organizationId) {
    return NextResponse.json({ data: null, error: 'Organizacao invalida para consulta.' }, { status: 400 });
  }

  if (!fullCityAccess && assignedPracas.length === 0) {
    const emptyData: FirstSeenRow[] = entregadorIds.map((id) => ({
      id_entregador: id,
      primeira_data_aparicao: null,
    }));
    return NextResponse.json({ data: emptyData, error: null });
  }

  const supabase = createServiceRoleClient();

  try {
    let firstSeenById: Map<string, string | null>;

    try {
      firstSeenById = await fetchFirstSeenAggregate(supabase, entregadorIds, organizationId, allowedPracas);
    } catch {
      firstSeenById = await fetchFirstSeenFallback(supabase, entregadorIds, organizationId, allowedPracas);
    }

    const data: FirstSeenRow[] = entregadorIds.map((id) => ({
      id_entregador: id,
      primeira_data_aparicao: firstSeenById.get(id) || null,
    }));

    return NextResponse.json({ data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar primeira aparicao do entregador.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
