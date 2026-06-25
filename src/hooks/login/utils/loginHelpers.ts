import { safeLog } from '@/lib/errorHandler';
import { getAppApiData, postAppApiData } from '@/utils/app/fetchAppApi';
import { IS_DEV } from '@/constants/environment';
import { sleep } from '@/utils/async/sleep';


export async function fetchUserProfile() {
    let profile: any = null;
    let profileError: any = null;

    try {
        const result = await getAppApiData<any>('/api/app/current-user-profile');
        profile = result.data;
        profileError = result.error;
    } catch (err) {
        profileError = err;
    }

    // Se houver erro, tentar novamente uma vez
    if (profileError && !profile) {
        await sleep(1000);
        try {
            const retryResult = await getAppApiData<any>('/api/app/current-user-profile');
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
        const { error: rpcError } = await postAppApiData<null>('/api/app/activity', {
            sessionId: userId,
            actionType: 'login',
            description: 'Fez login no sistema',
            tabName: 'dashboard',
            filtersApplied: null
        });

        if (rpcError) {
            const errorMessage = String(rpcError || '');
            const is404 = errorMessage.includes('404') || errorMessage.includes('not found');

            if (!is404 && IS_DEV) {
                safeLog.warn('Erro ao registrar atividade de login (não bloqueante):', rpcError);
            }
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('Erro ao registrar atividade de login:', err);
    }
}
