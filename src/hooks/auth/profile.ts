import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';
import { signOutAndRedirect } from '@/utils/authHelpers';
import { RPC_TIMEOUTS } from '@/constants/config';
import { CurrentUser } from '@/types';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchAndValidateProfile(
    router: any,
    requireApproval: boolean,
    requiredRole: 'admin' | 'marketing' | 'user' | undefined,
    fetchUserProfile: boolean
): Promise<CurrentUser | null> {
    try {
        console.log('🔵 [useAuthGuard] Buscando perfil do usuário...');
        const { data: profile, error: profileError } = await safeRpc<{
            is_approved: boolean;
            is_admin: boolean;
            assigned_pracas: string[];
            role?: 'admin' | 'marketing' | 'user' | 'master';
            organization_id?: string | null;
        }>('get_current_user_profile', {}, {
            timeout: RPC_TIMEOUTS.FAST,
            validateParams: false
        });

        console.log('🔵 [useAuthGuard] Resultado do perfil:', { profile, profileError });

        if (profileError) {
            // Erro ao buscar perfil - fazer logout e redirecionar
            console.log('🔴 [useAuthGuard] Erro ao buscar perfil:', profileError);
            if (IS_DEV) {
                safeLog.warn('[useAuthGuard] Erro ao buscar perfil, fazendo logout:', profileError);
            }
            await signOutAndRedirect(router);
            return null;
        }

        // Verificar aprovação
        if (requireApproval && !profile?.is_approved) {
            console.log('🔴 [useAuthGuard] Usuário não aprovado');
            if (IS_DEV) {
                safeLog.warn('[useAuthGuard] Usuário não aprovado, fazendo logout');
            }
            await signOutAndRedirect(router);
            return null;
        }

        console.log('✅ [useAuthGuard] Usuário aprovado, continuando...');

        // Verificar role
        if (requiredRole && profile?.role) {
            const roleHierarchy: Record<string, number> = {
                'user': 1,
                'marketing': 2,
                'admin': 3,
                'master': 4, // Master tem o nível mais alto
            };

            const userRoleLevel = roleHierarchy[profile.role] || 0;
            const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

            // Master e admin sempre têm acesso total
            const isMasterOrAdmin = profile.role === 'master' || profile.is_admin;

            if (!isMasterOrAdmin && userRoleLevel < requiredRoleLevel) {
                if (IS_DEV) {
                    safeLog.warn(`[useAuthGuard] Usuário não tem role suficiente. Requerido: ${requiredRole}, Atual: ${profile.role}`);
                }
                await signOutAndRedirect(router);
                return null;
            }
        }

        // Se fetchUserProfile, armazenar perfil
        if (fetchUserProfile && profile) {
            // Se for admin ou master sem organization_id, manter null para acesso total
            let organizationId = profile.organization_id || null;

            if (IS_DEV) {
                safeLog.info('[useAuthGuard] Perfil obtido:', {
                    is_admin: profile.is_admin,
                    role: profile.role,
                    has_organization_id: !!profile.organization_id,
                    organization_id: profile.organization_id,
                    final_organization_id: organizationId,
                });
            }
            return {
                is_admin: profile.is_admin || false,
                assigned_pracas: profile.assigned_pracas || [],
                role: profile.role || 'user',
                organization_id: organizationId,
            };
        }

        return null;
    } catch (err) {
        // Erro ao verificar perfil - fazer logout e redirecionar
        if (IS_DEV) {
            safeLog.error('[useAuthGuard] Erro ao verificar perfil:', err);
        }
        await signOutAndRedirect(router);
        return null;
    }
}
