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
    if (IS_DEV) safeLog.info('[HeaderAuth] Verifying session...');

    await checkSupabaseMock();

    // Header is UI state, not route security. Keep a valid local session alive
    // if the Auth/User endpoint has a transient failure.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
        const skipRedirect = shouldSkipRedirect(pathname);
        return {
            success: false,
            action: skipRedirect ? 'none' : 'redirect_login'
        };
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (IS_DEV) {
        safeLog.info('[HeaderAuth] Check result:', {
            pathname,
            hasSessionUser: !!session.user,
            hasVerifiedUser: !!authUser,
            error: authError?.message
        });
    }

    if (authError || !authUser) {
        if (IS_DEV) safeLog.warn('[HeaderAuth] getUser falhou; usando session.user como fallback:', authError);
        return { success: true, user: session.user };
    }

    return { success: true, user: authUser };
}

export async function verifyUserProfile() {
    const { profile, error: profileError } = await fetchUserProfileWithRetry();

    if (profileError) {
        if (isTemporaryError(profileError)) {
            if (IS_DEV) safeLog.warn('[Header] Erro temporario ao buscar perfil, mostrando header sem perfil:', profileError);
            return { success: false, action: 'none', error: profileError };
        }

        if (IS_DEV) safeLog.error('[Header] Erro ao carregar perfil:', profileError);
        return { success: false, action: 'none', error: profileError };
    }

    if (!profile?.is_approved) {
        if (IS_DEV) safeLog.warn('[Header] Usuario nao aprovado');
        await supabase.auth.signOut().catch(() => { });
        return { success: false, action: 'none', error: 'not_approved' };
    }

    return { success: true, profile: profile as UserProfile };
}
