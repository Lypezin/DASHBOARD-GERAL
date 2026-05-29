import { NextResponse } from 'next/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError
} from '@/utils/supabase/admin';
import { loadAuthenticatedUser } from '@/app/api/_shared/authenticatedUser';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const auth = await loadAuthenticatedUser();
        if ('failure' in auth) {
            return NextResponse.json({ error: auth.failure.message }, { status: auth.failure.status });
        }
        const { user } = auth;

        const body = await request.json().catch(() => null);
        const userId = typeof body?.userId === 'string' ? body.userId : '';
        const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';

        if (!userId || userId !== user.id) {
            return NextResponse.json({ error: 'Voce so pode atualizar o proprio perfil.' }, { status: 403 });
        }

        if (fullName.length < 2 || fullName.length > 120) {
            return NextResponse.json({ error: 'Nome invalido.' }, { status: 400 });
        }

        const admin = createServiceRoleClient();
        const nextMetadata = {
            ...(user.user_metadata || {}),
            full_name: fullName,
        };

        const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
            user_metadata: nextMetadata,
        });

        if (authUpdateError) {
            return NextResponse.json({ error: authUpdateError.message }, { status: 500 });
        }

        const { error: profileError } = await admin
            .from('user_profiles')
            .upsert({ id: userId, full_name: fullName, updated_at: new Date().toISOString() }, { onConflict: 'id' });

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ error: payload.error, code: payload.code }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao atualizar nome.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
