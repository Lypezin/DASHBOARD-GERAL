import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchUserProfile() {
    let profile: any = null;
    let profileError: any = null;

    try {
        const result = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
        profile = result.data;
        profileError = result.error;
    } catch (err) {
        profileError = err;
    }

    // Se houver erro, tentar novamente uma vez
    if (profileError && !profile) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const retryResult = await supabase.rpc('get_current_user_profile') as { data: any; error: any };
            profile = retryResult.data;
            profileError = retryResult.error;
        } catch (retryErr) {
            profileError = retryErr;
        }
    }

    return { profile, profileError };
}

export async function logLoginActivity(userId: string) {
    try {
        const { error: rpcError } = await supabase.rpc('registrar_atividade', {
            p_session_id: userId,
            p_action_type: 'login',
            p_action_details: 'Fez login no sistema',
            p_tab_name: 'dashboard',
            p_filters_applied: null
        });

        if (rpcError) {
            const errorCode = (rpcError as any)?.code || '';
            const errorMessage = String((rpcError as any)?.message || '');
            const is404 = errorCode === 'PGRST116' || errorCode === '42883' ||
                errorCode === 'PGRST204' ||
                errorMessage.includes('404') ||
                errorMessage.includes('not found');

            if (!is404 && IS_DEV) {
                safeLog.warn('Erro ao registrar atividade de login (não bloqueante):', rpcError);
            }
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao registrar atividade de login:', err);
    }
}
