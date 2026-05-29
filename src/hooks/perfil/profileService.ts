
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { getAppApiData } from '@/utils/app/fetchAppApi';
import { UserProfile } from './usePerfilData';

const IS_DEV = process.env.NODE_ENV === 'development';

export async function fetchUserProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { authUser: null, profile: null, error: null };

    const { data: profile, error: profileError } = await getAppApiData<UserProfile>('/api/app/current-user-profile');

    return { authUser, profile, error: profileError };
}

export async function fetchUserAvatar(profileId: string) {
    if (!profileId) return { avatarUrl: null, createdAt: null, error: null };

    try {
        if (IS_DEV) safeLog.info('🔍 Buscando avatar_url para usuário:', profileId);

        const { data: profileData, error: profileDataError } = await supabase
            .from('user_profiles')
            .select('avatar_url, id, updated_at, created_at')
            .eq('id', profileId)
            .single();

        if (IS_DEV) safeLog.info('📥 Resultado da busca:', { profileData, profileDataError });

        if (profileDataError && profileDataError.code === 'PGRST116') {
            await createEmptyProfile(profileId);
            return { avatarUrl: null, createdAt: null, error: null };
        }

        return {
            avatarUrl: profileData?.avatar_url,
            createdAt: profileData?.created_at,
            error: profileDataError
        };
    } catch (err) {
        if (IS_DEV) safeLog.warn('⚠️ Erro ao buscar avatar_url:', err);
        return { avatarUrl: null, createdAt: null, error: err };
    }
}

async function createEmptyProfile(profileId: string) {
    if (IS_DEV) safeLog.info('📝 Registro não existe, criando registro vazio...');
    try {
        const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
                id: profileId,
                avatar_url: null,
                updated_at: new Date().toISOString()
            });

        if (createError) {
            if (IS_DEV) safeLog.warn('⚠️ Erro ao criar registro vazio:', createError);
        } else {
            if (IS_DEV) safeLog.info('✅ Registro vazio criado com sucesso');
        }
    } catch (err) {
        if (IS_DEV) safeLog.warn('⚠️ Erro ao criar registro:', err);
    }
}
