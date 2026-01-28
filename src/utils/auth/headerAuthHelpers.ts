import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import { UserProfile } from '@/hooks/auth/types';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function checkSupabaseMock() {
    try {
        const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (IS_DEV) {
            safeLog.info('[Header] Verificando variáveis Supabase:', {
                hasUrl: !!runtimeUrl,
                isPlaceholder: runtimeUrl?.includes('placeholder')
            });
        }

        if (runtimeUrl?.includes('placeholder.supabase.co') && typeof (supabase as any)._recreate === 'function') {
            if (IS_DEV) {
                safeLog.warn('[Header] Cliente Supabase está usando mock, tentando recriar...');
            }
            (supabase as any)._recreate();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (clientErr) {
        if (IS_DEV) {
            safeLog.warn('[Header] Erro ao verificar cliente Supabase:', clientErr);
        }
    }
}

export async function fetchUserProfileWithRetry(): Promise<{ profile: UserProfile | null; error: any }> {
    let profile: UserProfile | null = null;
    let profileError: any = null;

    try {
        const result = await safeRpc<UserProfile>('get_current_user_profile', {}, {
            timeout: 10000,
            validateParams: false
        });
        profile = result.data;
        profileError = result.error;
    } catch (err) {
        profileError = err;
        if (IS_DEV) safeLog.warn('Erro ao buscar perfil (primeira tentativa):', err);
    }

    // Retry uma vez após 1 segundo
    if (profileError && !profile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const retryResult = await safeRpc<UserProfile>('get_current_user_profile', {}, {
                timeout: 10000,
                validateParams: false
            });
            profile = retryResult.data;
            profileError = retryResult.error;
        } catch (retryErr) {
            profileError = retryErr;
        }
    }

    return { profile, error: profileError };
}

export function isTemporaryError(error: any): boolean {
    if (!error) return false;

    const errorCode = error?.code || '';
    const errorMessage = String(error?.message || '');

    return errorCode === 'TIMEOUT' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorCode === 'PGRST301' ||
        errorMessage.includes('placeholder.supabase.co') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED');
}
