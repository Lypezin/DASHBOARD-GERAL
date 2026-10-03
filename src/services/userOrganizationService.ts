
/**
 * Helpers para resolver a organização do usuário a partir do perfil.
 */
import { safeLog } from '@/lib/errorHandler';
import { getCurrentUserProfileData } from '@/utils/app/fetchAppApi';
import { IS_DEV } from '@/constants/environment';


/**
 * Obtém organization_id somente do perfil canônico no banco.
 * Se for admin/master sem organization_id, retorna null para acesso global.
 */
export async function getCurrentUserOrganizationId(): Promise<string | null> {
    try {
        const { data: profile, error: profileError } = await getCurrentUserProfileData<{
            organization_id?: string | null;
            is_admin?: boolean;
            role?: string;
        }>();

        if (profileError || !profile) {
            if (IS_DEV) {
                safeLog.warn('[getCurrentUserOrganizationId] Erro ao buscar perfil:', profileError);
            }
            return null;
        }

        const orgId = profile.organization_id;

        // Se for admin ou master sem organization_id (ou com dummy UUID), retornar null para acesso total
        const isDummyId = orgId === '00000000-0000-0000-0000-000000000001';
        if ((!orgId || isDummyId) && (profile.is_admin || profile.role === 'master')) {
            if (IS_DEV) {
                safeLog.warn('[getCurrentUserOrganizationId] Admin/Master sem organization_id, retornando null para acesso total');
            }
            return null;
        }

        return (isDummyId ? null : orgId) || null;
    } catch (err) {
        if (IS_DEV) {
            safeLog.error('[getCurrentUserOrganizationId] Erro inesperado:', err);
        }
        return null;
    }
}
