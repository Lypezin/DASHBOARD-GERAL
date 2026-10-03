import { safeLog } from '@/lib/errorHandler';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserProfileData, postAppApiData } from '@/utils/app/fetchAppApi';
import { IS_DEV } from '@/constants/environment';
import { sleep } from '@/utils/async/sleep';
import { DELAYS } from '@/constants/config';

const LOGIN_PROFILE_SELECT = 'id, email, full_name, role, is_admin, is_approved, organization_id, assigned_pracas, avatar_url, created_at, updated_at';

function shouldRetryProfileLookup(errorCode: string, errorMessage: string) {
    const normalizedMessage = errorMessage.toLowerCase();
    return errorCode === 'PROFILE_QUERY_FAILED'
        || normalizedMessage.includes('profile_query_failed')
        || ['TIMEOUT', 'FETCH_ERROR', '57014'].includes(errorCode)
        || /timeout|timed out|network|failed to fetch|erro interno|\b50[0234]\b/i.test(normalizedMessage);
}

async function fetchOwnProfileWithSession(accessToken: string, authenticatedUserId?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        return { profile: null, error: new Error('Configuração pública do Supabase indisponível.') };
    }

    // Bind the just-issued token to this request instead of relying on when
    // the browser client finishes persisting its session after sign-in.
    let userId = authenticatedUserId;
    if (!userId) {
        const authClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        });
        const { data: { user }, error: userError } = await authClient.auth.getUser(accessToken);
        if (userError || !user) {
            return { profile: null, error: userError || new Error('A sessão autenticada não retornou um usuário.') };
        }
        userId = user.id;
    }

    // Supabase JS derives the PostgREST Authorization header from accessToken;
    // a global Authorization header alone is overwritten by the anon key.
    const profileClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        accessToken: async () => accessToken,
    });

    const { data, error } = await profileClient
        .from('user_profiles')
        .select(LOGIN_PROFILE_SELECT)
        .eq('id', userId)
        .maybeSingle();

    return { profile: data, error };
}

export async function fetchUserProfile(accessToken?: string, authenticatedUserId?: string) {
    let profile: any = null;
    let profileError: any = null;
    let directProfileError: any = null;

    // O login já retorna o ID autenticado. Consulte somente essa linha pela
    // RLS antes da API interna, evitando uma ida ao servidor no caminho normal.
    if (accessToken) {
        try {
            const directResult = await fetchOwnProfileWithSession(accessToken, authenticatedUserId);
            if (directResult.profile) {
                return { profile: directResult.profile, profileError: null };
            }
            directProfileError = directResult.error;
        } catch (err) {
            directProfileError = err;
        }
    }

    try {
        const result = await getCurrentUserProfileData<any>(accessToken);
        profile = result.data;
        profileError = result.error;
    } catch (err) {
        profileError = err;
    }

    const profileErrorMessage = typeof profileError === 'string'
        ? profileError
        : String((profileError as any)?.message || '');
    const profileErrorCode = String((profileError as any)?.code || '');
    const isServerConfigurationError = profileErrorCode === 'SERVER_SUPABASE_SERVICE_ROLE_MISSING'
        || profileErrorMessage.includes('SUPABASE_SERVICE_ROLE_KEY');

    // Erros transitórios podem ser reavaliados; erro de configuração não muda
    // com uma nova chamada e não deve adicionar espera ao fluxo de login.
    if (
        !profile
        && !isServerConfigurationError
        && shouldRetryProfileLookup(profileErrorCode, profileErrorMessage)
    ) {
        await sleep(DELAYS.AUTH_PROFILE_RETRY);
        try {
            const retryResult = await getCurrentUserProfileData<any>(accessToken);
            profile = retryResult.data;
            profileError = retryResult.error;
        } catch (retryErr) {
            profileError = retryErr;
        }
    }

    if (!profile && directProfileError) {
        if (!profileError) profileError = directProfileError;
        else if (IS_DEV) safeLog.warn('A leitura do próprio perfil pela sessão também falhou.', directProfileError);
    }

    if (!profile && !profileError) {
        profileError = new Error('A validação não retornou os dados do perfil. Tente novamente.');
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
