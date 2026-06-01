import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import {
  createServiceRoleClient,
  getServiceRoleConfigErrorPayload,
  isServiceRoleConfigError,
} from '@/utils/supabase/admin';

export const runtime = 'nodejs';

type RouteContext = {
  params: {
    id: string;
  };
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
      return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const profileId = context.params.id;
    if (!UUID_RE.test(profileId)) {
      return NextResponse.json({ data: null, error: 'Perfil invalido.' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from('user_profiles')
      .select('id, full_name, avatar_url, created_at')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: data || null, error: null });
  } catch (error) {
    if (isServiceRoleConfigError(error)) {
      const payload = getServiceRoleConfigErrorPayload();
      return NextResponse.json({ data: null, error: payload.error, code: payload.code }, { status: 503 });
    }

    const message = error instanceof Error ? error.message : 'Erro ao carregar perfil.';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
