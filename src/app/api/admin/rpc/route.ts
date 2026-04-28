import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export const runtime = 'nodejs';

const ADMIN_RPC_ALLOWLIST = new Set([
    'approve_user',
    'create_organization',
    'list_all_organizations',
    'list_all_users',
    'list_pending_users',
    'revoke_user_access',
    'set_user_admin',
    'update_organization',
    'update_user_organization',
    'update_user_pracas',
    'update_user_role'
]);

type CurrentUserProfile = {
    role?: string;
    is_admin?: boolean;
    is_approved?: boolean;
};

function normalizeProfile(profile: unknown): CurrentUserProfile | null {
    if (Array.isArray(profile)) {
        return (profile[0] as CurrentUserProfile) || null;
    }

    return (profile as CurrentUserProfile) || null;
}

function canUseAdminApi(profile: CurrentUserProfile) {
    const role = String(profile.role || '').toLowerCase();
    return profile.is_approved === true && (profile.is_admin === true || role === 'admin' || role === 'master');
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return NextResponse.json({ data: null, error: 'Usuario nao autenticado.' }, { status: 401 });
        }

        const { data: profileData, error: profileError } = await supabase.rpc('get_current_user_profile');
        const profile = normalizeProfile(profileData);

        if (profileError || !profile || !canUseAdminApi(profile)) {
            return NextResponse.json({ data: null, error: 'Usuario sem permissao administrativa.' }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        const rpcName = typeof body?.rpcName === 'string' ? body.rpcName : '';
        const params = body?.params && typeof body.params === 'object' ? body.params : {};

        if (!ADMIN_RPC_ALLOWLIST.has(rpcName)) {
            return NextResponse.json({ data: null, error: 'RPC administrativa nao permitida.' }, { status: 400 });
        }

        const admin = createServiceRoleClient();
        const { data, error } = await admin.rpc(rpcName, params);

        if (error) {
            return NextResponse.json({ data: null, error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ data, error: null });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido na API administrativa.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
