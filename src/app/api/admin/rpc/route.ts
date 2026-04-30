import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError
} from '@/utils/supabase/admin';
import {
    listAllUsers,
    listPendingUsers,
    approveUser,
    updateUserPracas,
    revokeUserAccess,
    setUserAdmin,
    updateUserRole,
    updateUserOrganization
} from './controllers/userController';
import {
    listAllOrganizations,
    createOrganization,
    updateOrganization
} from './controllers/organizationController';

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
    id?: string;
    role?: string;
    is_admin?: boolean;
    is_approved?: boolean;
    organization_id?: string | null;
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

async function executeAdminOperation(
    rpcName: string,
    params: Record<string, unknown>,
    profile: CurrentUserProfile
) {
    const admin = createServiceRoleClient();

    switch (rpcName) {
        case 'list_all_users':
            return listAllUsers(admin);
        case 'list_pending_users':
            return listPendingUsers(admin);
        case 'approve_user':
            return approveUser(admin, params, profile.id || null);
        case 'update_user_pracas':
            return updateUserPracas(admin, params);
        case 'revoke_user_access':
            return revokeUserAccess(admin, params);
        case 'set_user_admin':
            return setUserAdmin(admin, params, profile.id);
        case 'update_user_role':
            return updateUserRole(admin, params);
        case 'update_user_organization':
            return updateUserOrganization(admin, params);
        case 'list_all_organizations':
            return listAllOrganizations(admin);
        case 'create_organization':
            return createOrganization(admin, params);
        case 'update_organization':
            return updateOrganization(admin, params);
        default:
            return { data: null, error: { message: 'RPC administrativa nao implementada.' } };
    }
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

        const { data, error } = await executeAdminOperation(rpcName, params, profile);

        if (error) {
            return NextResponse.json({ data: null, error: error.message || error, details: error }, { status: 500 });
        }

        return NextResponse.json({ data, error: null });
    } catch (error) {
        if (isServiceRoleConfigError(error)) {
            const payload = getServiceRoleConfigErrorPayload();
            return NextResponse.json({ data: null, ...payload }, { status: 503 });
        }

        const message = error instanceof Error ? error.message : 'Erro desconhecido na API administrativa.';
        return NextResponse.json({ data: null, error: message }, { status: 500 });
    }
}
