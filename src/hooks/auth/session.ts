import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { clearSupabaseStorage, hasOldSupabaseTokens, signOutAndRedirect } from '@/utils/authHelpers';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function checkSession(router: any) {
    // PRIMEIRO: Limpar qualquer sessão inválida do localStorage antes de verificar
    if (hasOldSupabaseTokens()) {

        const { data: { session: testSession } } = await supabase.auth.getSession();
        if (!testSession || !testSession.user) {
            // Sessão inválida - limpar tudo

            if (IS_DEV) {
                safeLog.warn('[useAuthGuard] Limpando sessões inválidas do localStorage');
            }
            clearSupabaseStorage();
        }
    }

    // Verificar sessão atual

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
        // Sem sessão válida - limpar e redirecionar

        if (IS_DEV) {
            safeLog.warn('[useAuthGuard] Sem sessão válida, limpando e redirecionando para login');
        }
        await signOutAndRedirect(router);
        return null;
    }



    // Verificar se o token da sessão ainda é válido com retry

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
                // Esperar um pouco antes de tentar novamente (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
            }
        } catch (err) {

            verifyError = err;
            if (IS_DEV) safeLog.warn(`[useAuthGuard] Erro na tentativa ${i + 1}/${maxRetries}:`, err);
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
        }
    }

    if (verifyError || !verifiedUser) {
        // Token inválido após todas as tentativas - limpar e redirecionar

        if (IS_DEV) {
            safeLog.error('[useAuthGuard] Token inválido após retries, limpando e redirecionando:', verifyError);
        }
        await signOutAndRedirect(router);
        return null;
    }

    return verifiedUser;
}
