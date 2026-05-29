import { NextResponse } from 'next/server';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

const ALLOWED_INTERACTIONS = new Set([
    'login',
    'view_comparacao',
    'upload',
    'view_resumo',
    'view_entregadores',
    'view_evolucao',
    'filter_change',
]);

export async function GET() {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_gamification_leaderboard');

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: Array.isArray(data) ? data : [], error: null });
}

export async function POST(request: Request) {
    const auth = await loadAuthenticatedUser();
    if ('failure' in auth) {
        return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
    }

    const body = await request.json().catch(() => null);
    const interactionType = typeof body?.type === 'string' ? body.type : '';

    if (!ALLOWED_INTERACTIONS.has(interactionType)) {
        return NextResponse.json({ data: null, error: 'Tipo de interacao invalido.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('register_interaction', { p_interaction_type: interactionType });

    if (error) {
        return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ data: Array.isArray(data) ? data : [], error: null });
}
