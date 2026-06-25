
/**
 * Helpers para gerenciar organization_id no Supabase Auth
 */
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { IS_DEV } from '@/constants/environment';


/**
 * Sincroniza organization_id do user_profiles para user_metadata do Supabase Auth
 * Re-exported from authMetadataService
 */
export { syncOrganizationIdToMetadata } from './auth/authMetadataService';


/**
 * Obtém o organization_id do usuário atual
 * Tenta obter do user_metadata primeiro, depois do perfil
 * Se for admin/master sem organization_id, retorna organização padrão
 */
export async function getCurrentUserOrganizationId(): Promise<string | null> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            if (IS_DEV) {
                safeLog.warn('[getCurrentUserOrganizationId] Usuário não autenticado');
            }
            return null;
        }

        // Tentar obter do user_metadata primeiro
        const orgIdFromMetadata = user.user_metadata?.organization_id as string | undefined;
        if (orgIdFromMetadata && orgIdFromMetadata !== '00000000-0000-0000-0000-000000000001') {
            return orgIdFromMetadata;
        }

        // Se não tiver no metadata, buscar do perfil
        const { data: profile, error: profileError } = await getAppApiData<{
            organization_id?: string | null;
            is_admin?: boolean;
            role?: string;
        }>('/api/app/current-user-profile');

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
