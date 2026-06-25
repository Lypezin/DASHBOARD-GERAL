import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { IS_DEV } from '@/constants/environment';

interface ForgotPasswordState {
    loading: boolean;
    error: string | null;
    success: boolean;
}


function createPasswordResetClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return supabase;
    }

    // Password recovery links must work even when the email is opened from a
    // different browser. Using implicit flow avoids the PKCE code_verifier trap.
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            flowType: 'implicit',
            detectSessionInUrl: false,
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export function useForgotPassword() {
    const [state, setState] = useState<ForgotPasswordState>({
        loading: false,
        error: null,
        success: false,
    });

    const requestPasswordReset = async (email: string) => {
        setState({ loading: true, error: null, success: false });
        try {
            // Garantir que a URL de redirecionamento esteja correta
            const origin = window.location.origin.replace(/\/$/, '');
            const redirectTo = `${origin}/redefinir-senha`;
            
            if (IS_DEV) safeLog.info(`[Auth] Enviando reset para: ${email}`, { redirectTo });

            const passwordResetClient = createPasswordResetClient();
            const { error } = await passwordResetClient.auth.resetPasswordForEmail(email, {
                redirectTo,
            });

            if (error) throw error;

            setState({ loading: false, error: null, success: true });
        } catch (err: unknown) {
            safeLog.error('Erro ao enviar email de recuperação:', err);
            setState({
                loading: false,
                error: err instanceof Error ? err.message : 'Ocorreu um erro ao enviar o email. Tente novamente.',
                success: false,
            });
        }
    };

    return {
        ...state,
        requestPasswordReset,
    };
}
