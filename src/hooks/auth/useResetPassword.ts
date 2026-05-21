import { useEffect, useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';

interface ResetPasswordState {
    loading: boolean;
    checkingRecovery: boolean;
    error: string | null;
    success: boolean;
    canReset: boolean;
}

function getRecoveryErrorMessage(params: URLSearchParams) {
    const description = params.get('error_description');
    const errorCode = params.get('error_code');

    if (description) {
        return decodeURIComponent(description.replace(/\+/g, ' '));
    }

    if (errorCode === 'otp_expired') {
        return 'O link de redefinicao expirou. Solicite um novo link para trocar sua senha.';
    }

    return 'Nao foi possivel validar o link de redefinicao. Solicite um novo link e tente novamente.';
}

function clearRecoveryUrl() {
    if (typeof window === 'undefined') return;

    window.history.replaceState({}, document.title, window.location.pathname);
}

function isMissingCodeVerifierError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || '');
    return message.toLowerCase().includes('code verifier')
        || message.toLowerCase().includes('both auth code and code verifier');
}

export function useResetPassword() {
    const [state, setState] = useState<ResetPasswordState>({
        loading: false,
        checkingRecovery: true,
        error: null,
        success: false,
        canReset: false,
    });

    useEffect(() => {
        let cancelled = false;

        async function initializeRecoverySession() {
            if (typeof window === 'undefined') return;

            const params = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const code = params.get('code');
            const tokenHash = params.get('token_hash') || hashParams.get('token_hash');
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const hasRecoveryMarker = params.get('type') === 'recovery' || hashParams.get('type') === 'recovery';

            try {
                if (params.has('error')) {
                    throw new Error(getRecoveryErrorMessage(params));
                }

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) throw error;
                    clearRecoveryUrl();
                } else if (tokenHash) {
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: 'recovery',
                    });
                    if (error) throw error;
                    clearRecoveryUrl();
                } else if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        if (isMissingCodeVerifierError(error)) {
                            throw new Error('Este link antigo de redefinicao depende de uma verificacao que nao esta mais disponivel neste navegador. Solicite um novo link em "Esqueci minha senha" e abra o email novamente.');
                        }
                        throw error;
                    }
                    clearRecoveryUrl();
                } else {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) throw error;

                    if (!session?.user) {
                        throw new Error(hasRecoveryMarker
                            ? 'Nao foi possivel abrir uma sessao de recuperacao. Solicite um novo link e tente novamente.'
                            : 'Abra esta tela pelo link enviado no email de redefinicao de senha.'
                        );
                    }
                }

                if (!cancelled) {
                    setState((current) => ({
                        ...current,
                        checkingRecovery: false,
                        error: null,
                        canReset: true,
                    }));
                }
            } catch (err: unknown) {
                safeLog.error('Erro ao validar link de redefinicao:', err);
                if (!cancelled) {
                    setState((current) => ({
                        ...current,
                        checkingRecovery: false,
                        error: err instanceof Error ? err.message : 'Nao foi possivel validar o link de redefinicao.',
                        canReset: false,
                    }));
                }
            }
        }

        void initializeRecoverySession();

        return () => {
            cancelled = true;
        };
    }, []);

    const resetPassword = async (password: string) => {
        if (!state.canReset) {
            setState((current) => ({
                ...current,
                error: 'Solicite um novo link de redefinicao antes de trocar a senha.',
            }));
            return;
        }

        setState((current) => ({ ...current, loading: true, error: null, success: false }));

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
            if (signOutError) {
                safeLog.error('Erro ao encerrar sessao temporaria de redefinicao:', signOutError);
            }

            setState((current) => ({ ...current, loading: false, error: null, success: true }));
        } catch (err: unknown) {
            safeLog.error('Erro ao redefinir senha:', err);
            setState((current) => ({
                ...current,
                loading: false,
                error: err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir sua senha. Tente novamente.',
                success: false,
            }));
        }
    };

    return {
        ...state,
        resetPassword,
    };
}
