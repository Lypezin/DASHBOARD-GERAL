import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { UserProfile } from '@/hooks/auth/types';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { IS_DEV } from '@/constants/environment';
import { sleep } from '@/utils/async/sleep';


interface SupabaseClientWithRecreate {
    _recreate?: () => void;
}

export async function checkSupabaseMock() {
    try {
        const runtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (IS_DEV) {
            safeLog.info('[Header] Verificando variáveis Supabase:', {
                hasUrl: !!runtimeUrl,
                isPlaceholder: runtimeUrl?.includes('placeholder')
            });
        }

        const supabaseClient = supabase as unknown as SupabaseClientWithRecreate;

        if (runtimeUrl?.includes('placeholder.supabase.co') && typeof supabaseClient._recreate === 'function') {
            if (IS_DEV) {
                safeLog.warn('[Header] Cliente Supabase está usando mock, tentando recriar...');
            }
            supabaseClient._recreate?.();
            await sleep(500);
        }
    } catch (clientErr) {
        if (IS_DEV) {
            safeLog.warn('[Header] Erro ao verificar cliente Supabase:', clientErr);
        }
    }
}

export async function fetchUserProfileWithRetry(): Promise<{ profile: UserProfile | null; error: PostgrestError | Error | null }> {
    let profile: UserProfile | null = null;
    let profileError: PostgrestError | Error | null = null;

    try {
        const result = await getAppApiData<UserProfile>('/api/app/current-user-profile');
        profile = result.data;
        profileError = result.error ? new Error(result.error) : null;
    } catch (err) {
        profileError = err as Error;
        if (IS_DEV) safeLog.warn('Erro ao buscar perfil (primeira tentativa):', err);
    }

    // Retry uma vez após 1 segundo
    if (profileError && !profile) {
        await sleep(1000);
        try {
            const retryResult = await getAppApiData<UserProfile>('/api/app/current-user-profile');
            profile = retryResult.data;
            profileError = retryResult.error ? new Error(retryResult.error) : null;
        } catch (retryErr) {
            profileError = retryErr as Error;
        }
    }

    return { profile, error: profileError };
}

export function isTemporaryError(error: unknown): boolean {
    if (!error) return false;

    // Type guard basic check
    const errObj = error as { code?: string; message?: string };
    const errorCode = errObj.code || '';
    const errorMessage = String(errObj.message || '');

    return errorCode === 'TIMEOUT' ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorCode === 'PGRST301' ||
        errorMessage.includes('placeholder.supabase.co') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED');
}
