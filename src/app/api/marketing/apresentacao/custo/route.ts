import { NextResponse } from 'next/server';
import { hasElevatedRole, loadCurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' };
type PeriodType = 'day' | 'week';

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

function parsePeriod(value: string | null): PeriodType | null {
  return value === 'day' || value === 'week' ? value : null;
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

async function authorizeMarketing() {
  const auth = await loadCurrentUserProfile({
    requireApproved: true,
    notApprovedMessage: 'Usuário ainda não aprovado.',
  });
  if ('failure' in auth) return { response: privateJson({ data: null, error: auth.failure.message }, auth.failure.status) };

  const role = String(auth.profile.role || '').toLowerCase();
  if (!hasElevatedRole(auth.profile) && role !== 'marketing') {
    return { response: privateJson({ data: null, error: 'Esta apresentação é restrita ao time de Marketing.' }, 403) };
  }
  return { profile: auth.profile };
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeMarketing();
    if ('response' in auth) return auth.response;

    const url = new URL(request.url);
    const periodType = parsePeriod(url.searchParams.get('period'));
    const dateRef = parseDate(url.searchParams.get('date'));
    if (!periodType || !dateRef) {
      return privateJson({ data: null, error: 'Informe um período e uma data válidos.' }, 400);
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from('marketing_apresentacao_costs')
      .select('total_cost, updated_at')
      .eq('period_type', periodType)
      .eq('date_ref', dateRef)
      .maybeSingle();

    if (error) throw error;
    return privateJson({
      data: { totalCost: Number(data?.total_cost || 0), updatedAt: data?.updated_at || null },
      error: null,
    });
  } catch {
    return privateJson({ data: null, error: 'Não foi possível consultar o custo salvo.' }, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorizeMarketing();
    if ('response' in auth) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const periodType = parsePeriod(typeof body?.period === 'string' ? body.period : null);
    const dateRef = parseDate(body?.date);
    const totalCost = typeof body?.totalCost === 'number' ? body.totalCost : Number(body?.totalCost);

    if (!periodType || !dateRef || !Number.isFinite(totalCost) || totalCost < 0 || totalCost > 100_000_000) {
      return privateJson({ data: null, error: 'Confira o período, a data e o valor do custo.' }, 400);
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from('marketing_apresentacao_costs')
      .upsert({
        period_type: periodType,
        date_ref: dateRef,
        total_cost: Math.round(totalCost * 100) / 100,
        updated_by: auth.profile.id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'period_type,date_ref' })
      .select('total_cost, updated_at')
      .single();

    if (error) throw error;
    return privateJson({
      data: { totalCost: Number(data.total_cost), updatedAt: data.updated_at },
      error: null,
    });
  } catch {
    return privateJson({ data: null, error: 'Não foi possível salvar o custo. Verifique a configuração do banco.' }, 500);
  }
}
