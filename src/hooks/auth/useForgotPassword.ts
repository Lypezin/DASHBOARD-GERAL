import { useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';

interface ForgotPasswordState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

const IS_DEV = process.env.NODE_ENV === 'development';

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

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
