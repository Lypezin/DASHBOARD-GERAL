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
        const avatarUrl = typeof body?.avatarUrl === 'string'
            ? body.avatarUrl.trim()
            : body?.avatarUrl === null
                ? null
                : undefined;

        if (!userId || userId !== user.id) {
            return NextResponse.json({ error: 'Voce so pode atualizar o proprio avatar.' }, { status: 403 });
        }

        if (avatarUrl === undefined) {
            return NextResponse.json({ error: 'Payload invalido para avatar.' }, { status: 400 });
        }

        const admin = createServiceRoleClient();
        const nextMetadata = {
            ...(user.user_metadata || {}),
            avatar_url: avatarUrl,
        };

        const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
            user_metadata: nextMetadata,
        });

        if (authUpdateError) {
            return NextResponse.json({ error: authUpdateError.message }, { status: 500 });
        }

        const { error: profileError } = await admin
            .from('user_profiles')
            .upsert({ id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() }, { onConflict: 'id' });

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ error: payload.error, code: payload.code }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro ao atualizar avatar.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
