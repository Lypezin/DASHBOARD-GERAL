import { NextResponse } from 'next/server';
import {
    createServiceRoleClient,
    getServiceRoleConfigErrorPayload,
    isServiceRoleConfigError
} from '@/utils/supabase/admin';
import type { CurrentUserProfile } from '@/app/api/_shared/currentUserProfile';
import {
    loadCurrentUserProfile,
} from '@/app/api/_shared/currentUserProfile';
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
    'list_pracas_disponiveis',
    'list_all_users',
    'list_pending_users',
    'revoke_user_access',
    'set_user_admin',
    'update_organization',
    'update_user_organization',
    'update_user_pracas',
    'update_user_role'
]);

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
        case 'list_pracas_disponiveis':
            return admin.rpc('list_pracas_disponiveis');
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
        const auth = await loadCurrentUserProfile({
            requireApproved: true,
            requireElevatedRole: true,
            missingProfileMessage: 'Usuario sem permissao administrativa.',
            notApprovedMessage: 'Usuario sem permissao administrativa.',
            forbiddenMessage: 'Usuario sem permissao administrativa.',
        });

        if ('failure' in auth) {
            return NextResponse.json({ data: null, error: auth.failure.message }, { status: auth.failure.status });
        }
        const { profile } = auth;

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
