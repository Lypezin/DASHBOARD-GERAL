import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { clearSupabaseStorage, hasOldSupabaseTokens, signOutAndRedirect } from '@/utils/authHelpers';
import { IS_DEV } from '@/constants/environment';


export async function checkSession(router: any) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (hasOldSupabaseTokens() && (!session || !session.user)) {
        if (IS_DEV) safeLog.warn('[useAuthGuard] Limpando sessoes invalidas do localStorage');
        clearSupabaseStorage();
    }

    if (sessionError || !session || !session.user) {
        if (IS_DEV) safeLog.warn('[useAuthGuard] Sem sessao valida, redirecionando para login');
        await signOutAndRedirect(router);
        return null;
    }

    return session.user;
}
