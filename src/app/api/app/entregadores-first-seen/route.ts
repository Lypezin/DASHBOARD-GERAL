import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 15000;

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

async function fetchFirstSeenBatch(
  supabase: ReturnType<typeof createServiceRoleClient>,
  ids: string[],
  organizationId: string | null,
  allowedPracas: string[] | null,
) {
  const result = new Map<string, string | null>();

  const { data, error } = await supabase.rpc('get_entregadores_first_seen_v1', {
    p_entregador_ids: ids,
    p_organization_id: organizationId,
    p_allowed_pracas: allowedPracas,
  });

  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('A consulta de primeira aparição retornou uma resposta inválida.');

  for (const row of data) {
    const id = normalizeString(row.id_entregador, 120);
    const date = typeof row.primeira_data_aparicao === 'string' ? row.primeira_data_aparicao : null;
    if (id) result.set(id, date);
  }

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
    const firstSeenById = await fetchFirstSeenBatch(supabase, entregadorIds, organizationId, allowedPracas);

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
