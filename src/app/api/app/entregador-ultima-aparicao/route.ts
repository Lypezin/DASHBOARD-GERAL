import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile, resolveAuthorizedOrganizationId } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CITY_ROWS = 1000;
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' };

function respond(data: unknown, error: string | null = null, status = 200) {
  return NextResponse.json({ data, error }, { status, headers: PRIVATE_HEADERS });
}

export async function POST(request: Request) {
  try {
    const auth = await loadCurrentUserProfile({ requireApproved: true });
    if ('failure' in auth) return respond(null, auth.failure.message, auth.failure.status);

    const body = await request.json().catch(() => null) as { entregadorId?: unknown; organizationId?: unknown } | null;
    const id = typeof body?.entregadorId === 'string' ? body.entregadorId.trim() : '';
    if (!id || id.length > 120) return respond(null, 'Identificador do entregador inválido.', 400);

    const access = resolveAuthorizedOrganizationId(auth.profile, body?.organizationId);
    if ('failure' in access) return respond(null, access.failure.message, access.failure.status);

    const fullCityAccess = hasElevatedRole(auth.profile) || String(auth.profile.role || '').toLowerCase() === 'marketing';
    const allowedCities = Array.isArray(auth.profile.assigned_pracas)
      ? auth.profile.assigned_pracas.map((city) => String(city).trim()).filter(Boolean)
      : [];
    if (!fullCityAccess && allowedCities.length === 0) return respond({ ultima_data_aparicao: null, cidades: [], cidades_incompletas: false });

    const supabase = createServiceRoleClient();
    const baseQuery = (countCities = false) => {
      let query = supabase.from('dados_corridas').select('data_do_periodo, praca', countCities ? { count: 'exact' } : undefined)
        .eq('organization_id', access.organizationId)
        .eq('id_da_pessoa_entregadora', id);
      if (!fullCityAccess) query = query.in('praca', allowedCities);
      return query;
    };

    const { data: latestRows, error: latestError } = await baseQuery()
      .not('data_do_periodo', 'is', null)
      .order('data_do_periodo', { ascending: false })
      .limit(1);
    if (latestError) throw new Error(latestError.message);
    if (!Array.isArray(latestRows)) throw new Error('Resposta inválida ao consultar a última aparição.');
    const date = latestRows?.[0]?.data_do_periodo;
    if (!latestRows.length) {
      return respond({ ultima_data_aparicao: null, cidades: [], cidades_incompletas: false });
    }
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data de última aparição inválida.');

    const { data: cityRows, error: cityError, count } = await baseQuery(true)
      .eq('data_do_periodo', date)
      .not('praca', 'is', null)
      .limit(MAX_CITY_ROWS);
    if (cityError) throw new Error(cityError.message);
    if (!Array.isArray(cityRows) || typeof count !== 'number') throw new Error('Resposta inválida ao consultar cidades.');

    const cities = new Map<string, string>();
    for (const row of cityRows.slice(0, MAX_CITY_ROWS)) {
      const city = typeof row.praca === 'string' ? row.praca.trim() : '';
      if (city && !cities.has(city.toLocaleLowerCase('pt-BR'))) cities.set(city.toLocaleLowerCase('pt-BR'), city);
    }
    return respond({
      ultima_data_aparicao: date,
      cidades: [...cities.values()].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      cidades_incompletas: count > cityRows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível consultar a última aparição.';
    return respond(null, message, 500);
  }
}
