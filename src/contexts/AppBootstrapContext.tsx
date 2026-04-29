'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { checkSupabaseMock } from '@/utils/auth/headerAuthHelpers';
import type { Organization } from './organizationTypes';

import { 
  type AppBootstrapState, 
  type AppBootstrapContextValue, 
  EMPTY_STATE 
} from './bootstrap/types';

import { 
  fetchProfileWithRetry, 
  hydrateAvatarUrl, 
  resolveOrganization, 
  buildSnapshot 
} from './bootstrap/helpers';

const IS_DEV = process.env.NODE_ENV === 'development';
const AppBootstrapContext = createContext<AppBootstrapContextValue | undefined>(undefined);

let cachedState: AppBootstrapState | null = null;
let inFlightBootstrap: Promise<AppBootstrapState> | null = null;
let cachedOrganization: { id: string; value: Organization | null } | null = null;

function clearBootstrapCache() {
  cachedState = null;
  inFlightBootstrap = null;
  cachedOrganization = null;
}

async function resolveBootstrapState(force: boolean = false): Promise<AppBootstrapState> {
  if (!force && cachedState?.hasResolved) {
    return cachedState;
  }

  if (!force && inFlightBootstrap) {
    return inFlightBootstrap;
  }

  inFlightBootstrap = (async () => {
    try {
      await checkSupabaseMock();

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        cachedState = {
          ...EMPTY_STATE,
          isLoading: false,
          hasResolved: true,
        };
        return cachedState;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const authUser = userError || !user ? session.user : user;
      const cachedUserId = cachedState?.authUser?.id || null;

      if (!force && cachedState?.hasResolved && cachedUserId === authUser.id) {
        return cachedState;
      }

      const rawProfile = await fetchProfileWithRetry();
      const profile = await hydrateAvatarUrl(authUser, rawProfile);
      const organizationId = profile?.organization_id
        || authUser.user_metadata?.organization_id
        || null;
        
      const organization = await resolveOrganization(
        organizationId, 
        cachedOrganization,
        (cache) => { cachedOrganization = cache; }
      );

      const nextState = buildSnapshot(authUser, profile, organization, profile ? null : 'profile_unavailable');
      cachedState = nextState;
      return nextState;
    } catch (error) {
      if (IS_DEV) {
        safeLog.error('[AppBootstrap] Erro inesperado no bootstrap:', error);
      }

      const fallbackState = {
        ...EMPTY_STATE,
        isLoading: false,
        hasResolved: true,
        error: error instanceof Error ? error.message : 'Erro ao carregar sessao',
      };

      cachedState = fallbackState;
      return fallbackState;
    } finally {
      inFlightBootstrap = null;
    }
  })();

  return inFlightBootstrap;
}

export function AppBootstrapProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppBootstrapState>(() => cachedState || EMPTY_STATE);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async (force: boolean = false) => {
    const requestId = ++requestIdRef.current;

    setState((prev) => ({
      ...prev,
      isLoading: true,
    }));

    const nextState = await resolveBootstrapState(force);
    if (requestIdRef.current === requestId) {
      setState(nextState);
    }
  }, []);

  useEffect(() => {
    void refresh(false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearBootstrapCache();
        setState({
          ...EMPTY_STATE,
          isLoading: false,
          hasResolved: true,
        });
        return;
      }

      const nextUserId = session?.user?.id || null;
      const cachedUserId = cachedState?.authUser?.id || null;
      const shouldForce = event === 'USER_UPDATED' || (event === 'SIGNED_IN' && nextUserId !== cachedUserId);

      if (event === 'TOKEN_REFRESHED' && nextUserId && cachedState?.authUser?.id === nextUserId) {
        setState((prev) => {
          const nextState = {
            ...prev,
            authUser: session?.user || prev.authUser,
            avatarUrl: prev.avatarUrl
              || session?.user?.user_metadata?.avatar_url
              || session?.user?.user_metadata?.picture
              || null,
            isAuthenticated: true,
          };
          cachedState = nextState;
          return nextState;
        });
        return;
      }

      void refresh(shouldForce);
    });

    const handleProfileUpdate = () => {
      void refresh(true);
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
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      safeLog.error('[AppBootstrap] Erro ao fazer logout:', error);
    }
  }, []);

  const value = useMemo<AppBootstrapContextValue>(() => ({
    ...state,
    refresh,
    handleLogout,
  }), [state, refresh, handleLogout]);

  return (
    <AppBootstrapContext.Provider value={value}>
      {children}
    </AppBootstrapContext.Provider>
  );
}

export function useAppBootstrap() {
  const context = useContext(AppBootstrapContext);
  if (!context) {
    return {
      ...EMPTY_STATE,
      refresh: async () => {},
      handleLogout: async () => {},
    };
  }

  return context;
}
