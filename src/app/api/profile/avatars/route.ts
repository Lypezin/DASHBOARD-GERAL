import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import {
  createServiceRoleClient,
  getServiceRoleConfigErrorPayload,
  isServiceRoleConfigError,
} from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null) as { ids?: unknown } | null;
    const ids = Array.isArray(body?.ids)
      ? Array.from(new Set(body.ids.map((id) => String(id).trim()).filter((id) => UUID_RE.test(id)))).slice(0, 100)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from('user_profiles')
      .select('id, avatar_url')
      .in('id', ids)
      .not('avatar_url', 'is', null);

    if (error) {
      return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], error: null });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao carregar avatares.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
