import { supabase } from '@/lib/supabaseClient';
import { safeRpc } from '@/lib/rpcWrapper';
import { safeLog } from '@/lib/errorHandler';

interface UserProfile {
    is_admin: boolean;
    is_approved: boolean;
}

export async function checkAdminStatus() {
    try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            safeLog.error('Erro ao obter usuário:', authError);
            return { authorized: false, user: null, redirect: '/login' };
        }

        const profileResult = await safeRpc<UserProfile>('get_current_user_profile', {}, {
            timeout: 8000,
            validateParams: false
        });

        const { data: profile, error } = profileResult;

        if (error) {
            safeLog.error('Erro ao verificar perfil do usuário:', error);
            return { authorized: false, user: authUser, error: true };
        }

        if (!profile?.is_admin) {
            return { authorized: false, user: authUser, redirect: '/' };
        }

        if (!profile?.is_approved) {
            return { authorized: false, user: authUser, redirect: '/login' };
        }

        return { authorized: true, user: authUser };
    } catch (err) {
        safeLog.error('Erro ao verificar autenticação:', err);
        return { authorized: false, user: null, error: true };
    }
}
