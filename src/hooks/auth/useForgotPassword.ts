import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ForgotPasswordState {
    loading: boolean;
    error: string | null;
    success: boolean;
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
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/redefinir-senha`,
            });

            if (error) throw error;

            setState({ loading: false, error: null, success: true });
        } catch (err: any) {
            console.error('Erro ao enviar email de recuperação:', err);
            setState({
                loading: false,
                error: err.message || 'Ocorreu um erro ao enviar o email. Tente novamente.',
                success: false,
            });
        }
    };

    return {
        ...state,
        requestPasswordReset,
    };
}
