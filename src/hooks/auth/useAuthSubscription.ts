
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { UserProfile } from '@/hooks/auth/types';
import { shouldSkipRedirect } from '@/hooks/auth/utils/headerAuthSteps';
import { useRouter } from 'next/navigation';

import { isPasswordRecoveryFlow, ensureRecoveryRedirect } from './utils/recoveryDetection';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseAuthSubscriptionProps {
    checkUser: () => void;
    setUser: (user: UserProfile | null) => void;
    pathname: string;
}

export function useAuthSubscription({ checkUser, setUser, pathname }: UseAuthSubscriptionProps) {
    const router = useRouter();

    useEffect(() => {
        // Verificar imediatamente no mount se estamos em fluxo de recuperação
        ensureRecoveryRedirect(router);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (IS_DEV) safeLog.info(`[Auth] Evento: ${event}`, { pathname });

            if (event === 'SIGNED_IN') {
                // Se for um login vindo de recuperação, evitamos carregar o perfil do dashboard
                if (!isPasswordRecoveryFlow()) {
                    checkUser();
                } else if (pathname !== '/redefinir-senha') {
                    router.push('/redefinir-senha');
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                if (!shouldSkipRedirect(pathname)) {
                    const search = typeof window !== 'undefined' ? window.location.search : '';
                    router.push(`/login${search}`);
                }
            } else if (event === 'PASSWORD_RECOVERY') {
                if (IS_DEV) safeLog.info('[Auth] Evento PASSWORD_RECOVERY recebido, forçando redefinir-senha');
                router.push('/redefinir-senha');
            } else if (event === 'USER_UPDATED') {
                if (IS_DEV) safeLog.info('[Header] Evento USER_UPDATED recebido, atualizando perfil...');
                checkUser();
            }
        });

        const handleProfileUpdate = (event: CustomEvent) => {
            if (IS_DEV) safeLog.info('[Header] Evento customizado userProfileUpdated recebido, atualizando perfil...', event.detail);
            checkUser();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
        }

        return () => {
            subscription.unsubscribe();
            if (typeof window !== 'undefined') {
                window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
            }
        };
    }, [checkUser, setUser, pathname, router]);
}
