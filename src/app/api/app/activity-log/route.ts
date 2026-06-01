import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import {
  createServiceRoleClient,
  getServiceRoleConfigErrorPayload,
  isServiceRoleConfigError,
} from '@/utils/supabase/admin';

export const runtime = 'nodejs';

type ActivityLogBody = {
  id?: unknown;
  path?: unknown;
  durationSeconds?: unknown;
  action?: unknown;
};

function normalizePath(value: unknown) {
  if (typeof value !== 'string') return '/';
  const path = value.trim();
  return path ? path.slice(0, 500) : '/';
}

function normalizeUuid(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)
    ? trimmed
    : null;
}

function normalizeDuration(value: unknown) {
  const duration = Number(value);
  return Number.isFinite(duration) ? Math.max(0, Math.min(Math.round(duration), 24 * 60 * 60)) : null;
}

export async function POST(request: Request) {
  try {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as ActivityLogBody | null;
    const admin = createServiceRoleClient();
    const now = new Date().toISOString();

    const { data, error } = await admin
      .from('user_activity_logs')
      .insert({
        user_id: auth.user.id,
        path: normalizePath(body?.path),
        entered_at: now,
        last_seen: now,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao registrar atividade.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as ActivityLogBody | null;
    const id = normalizeUuid(body?.id);
    if (!id) {
      return NextResponse.json({ data: null, error: 'Sessao de atividade invalida.' }, { status: 400 });
    }

    const action = typeof body?.action === 'string' ? body.action : 'heartbeat';
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = { last_seen: now };

    if (action === 'close') {
      updatePayload.exited_at = now;
      const duration = normalizeDuration(body?.durationSeconds);
      if (duration !== null) updatePayload.duration_seconds = duration;
    }

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('user_activity_logs')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', auth.user.id);

    if (error) {
      return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao atualizar atividade.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
