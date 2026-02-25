import { useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';

interface ResetPasswordState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export function useResetPassword() {
    const [state, setState] = useState<ResetPasswordState>({
        loading: false,
        error: null,
        success: false,
    });

    const resetPassword = async (password: string) => {
        setState({ loading: true, error: null, success: false });

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setState({ loading: false, error: null, success: true });
        } catch (err: unknown) {
            safeLog.error('Erro ao redefinir senha:', err);
            setState({
                loading: false,
                error: err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir sua senha. Tente novamente.',
                success: false,
            });
        }
    };

    return {
        ...state,
        resetPassword,
    };
}
