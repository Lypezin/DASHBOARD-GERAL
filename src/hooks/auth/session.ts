import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { clearSupabaseStorage, hasOldSupabaseTokens, signOutAndRedirect } from '@/utils/authHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function checkSession(router: any) {
    if (hasOldSupabaseTokens()) {
        const { data: { session: testSession } } = await supabase.auth.getSession();
        if (!testSession || !testSession.user) {
            if (IS_DEV) safeLog.warn('[useAuthGuard] Limpando sessoes invalidas do localStorage');
            clearSupabaseStorage();
        }
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
        if (IS_DEV) safeLog.warn('[useAuthGuard] Sem sessao valida, redirecionando para login');
        await signOutAndRedirect(router);
        return null;
    }

    let verifiedUser = null;
    let verifyError = null;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (user) {
                verifiedUser = user;
                verifyError = null;
                break;
            } else if (error) {
                verifyError = error;
                if (IS_DEV) safeLog.warn(`[useAuthGuard] Tentativa ${i + 1}/${maxRetries} falhou:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
            }
        } catch (err) {
            verifyError = err;
            if (IS_DEV) safeLog.warn(`[useAuthGuard] Erro na tentativa ${i + 1}/${maxRetries}:`, err);
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
        }
    }

    if (verifyError || !verifiedUser) {
        // Do not destroy a local session because of a transient Auth/User endpoint failure.
        // Server middleware still validates protected navigations, and Supabase refreshes tokens in the background.
        if (IS_DEV) safeLog.warn('[useAuthGuard] getUser falhou apos retries; usando session.user como fallback:', verifyError);
        return session.user;
    }

    return verifiedUser;
}
