import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useSessionId() {
    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {
        let mounted = true;
        let retryTimeout: NodeJS.Timeout | null = null;

        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted && session?.user?.id) {
                    setSessionId(session.user.id);
                    if (IS_DEV) {
                        safeLog.info('SessionId capturado:', session.user.id);
                    }
                } else if (mounted) {
                    // Tentar novamente após 1 segundo se não conseguir na primeira tentativa
                    retryTimeout = setTimeout(async () => {
                        if (!mounted) return;
                        try {
                            const { data: { session: retrySession } } = await supabase.auth.getSession();
                            if (retrySession?.user?.id && mounted) {
                                setSessionId(retrySession.user.id);
                                if (IS_DEV) {
                                    safeLog.info('SessionId capturado no retry:', retrySession.user.id);
                                }
                            }
                        } catch (err) {
                            if (IS_DEV) {
                                safeLog.warn('Erro ao capturar sessionId no retry:', err);
                            }
                        }
                    }, 1000);
                }
            } catch (err) {
                if (IS_DEV) {
                    safeLog.warn('Erro ao capturar sessionId:', err);
                }
            }
        };

        // Capturar sessionId inicial
        getSession();

        // Listener para mudanças na sessão
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (mounted && session?.user?.id) {
                setSessionId(session.user.id);
                if (IS_DEV) {
                    safeLog.info('SessionId atualizado via listener:', session.user.id);
                }
            } else if (mounted && event === 'SIGNED_OUT') {
                setSessionId('');
            }
        });

        return () => {
            mounted = false;
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
            subscription.unsubscribe();
        };
    }, []);

    return sessionId;
}
