import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return NextResponse.json({ error: 'Usuario nao autenticado.' }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const userId = typeof body?.userId === 'string' ? body.userId : '';
        const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';

        if (!userId || userId !== userData.user.id) {
            return NextResponse.json({ error: 'Voce so pode atualizar o proprio perfil.' }, { status: 403 });
        }

        if (fullName.length < 2 || fullName.length > 120) {
            return NextResponse.json({ error: 'Nome invalido.' }, { status: 400 });
        }

        const admin = createServiceRoleClient();
        const nextMetadata = {
            ...(userData.user.user_metadata || {}),
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
        const message = error instanceof Error ? error.message : 'Erro ao atualizar nome.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
