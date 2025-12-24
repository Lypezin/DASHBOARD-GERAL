
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { UserProfile } from '@/hooks/auth/types';
import { shouldSkipRedirect } from '@/hooks/auth/utils/headerAuthSteps';
import { useRouter } from 'next/navigation';

const IS_DEV = process.env.NODE_ENV === 'development';

interface UseAuthSubscriptionProps {
    checkUser: () => void;
    setUser: (user: UserProfile | null) => void;
    pathname: string;
}

export function useAuthSubscription({ checkUser, setUser, pathname }: UseAuthSubscriptionProps) {
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                checkUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                if (!shouldSkipRedirect(pathname)) {
                    router.push('/login');
                }
            } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (IS_DEV && event === 'USER_UPDATED') {
                    safeLog.info('[Header] Evento USER_UPDATED recebido, atualizando perfil...');
                }
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
