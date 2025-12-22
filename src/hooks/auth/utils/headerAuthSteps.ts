import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { checkSupabaseMock, fetchUserProfileWithRetry, isTemporaryError } from '@/utils/auth/headerAuthHelpers';
import { UserProfile } from '../types';

const IS_DEV = process.env.NODE_ENV === 'development';

export const shouldSkipRedirect = (pathname: string) => {
    return (
        pathname === '/login' ||
        pathname === '/registro' ||
        pathname === '/esqueci-senha' ||
        pathname === '/redefinir-senha'
    );
};

export async function verifyAuthSession(pathname: string) {
    if (IS_DEV) console.log('[HeaderAuth] Verifying session...');

    // 1. Verificar Mock
    await checkSupabaseMock();

    // 2. Verificar Sessão Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (IS_DEV) {
        console.log('[HeaderAuth] Check result:', {
            pathname,
            hasUser: !!authUser,
            error: authError?.message
        });
    }

    if (authError || !authUser) {
        const skipRedirect = shouldSkipRedirect(pathname);
        return {
            success: false,
            action: skipRedirect ? 'none' : 'redirect_login'
        };
    }

    return { success: true, user: authUser };
}

export async function verifyUserProfile() {
    // 3. Buscar Perfil
    const { profile, error: profileError } = await fetchUserProfileWithRetry();

    // 4. Tratar Erros de Perfil
    if (profileError) {
        if (isTemporaryError(profileError)) {
            if (IS_DEV) safeLog.warn('[Header] Erro temporário ao buscar perfil, mostrando header sem perfil:', profileError);
            return { success: false, action: 'none', error: profileError };
        }

        if (IS_DEV) safeLog.error('[Header] Erro ao carregar perfil:', profileError);
        return { success: false, action: 'none', error: profileError };
    }

    // 5. Verificar Aprovação
    if (!profile?.is_approved) {
        if (IS_DEV) safeLog.warn('[Header] Usuário não aprovado');
        await supabase.auth.signOut().catch(() => { });
        return { success: false, action: 'none', error: 'not_approved' };
    }

    return { success: true, profile: profile as UserProfile };
}
