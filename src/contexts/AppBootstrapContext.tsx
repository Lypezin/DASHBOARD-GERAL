'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { CurrentUser } from '@/types';
import type { UserProfile } from '@/hooks/auth/types';
import { checkSupabaseMock } from '@/utils/auth/headerAuthHelpers';
import { fetchOrganizationData } from './hooks/organizationDataHelper';
import type { Organization } from './organizationTypes';

const IS_DEV = process.env.NODE_ENV === 'development';

type BootstrapProfile = UserProfile & {
  assigned_pracas?: string[];
};

interface AppBootstrapState {
  authUser: User | null;
  profile: BootstrapProfile | null;
  currentUser: CurrentUser | null;
  organization: Organization | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasResolved: boolean;
  error: string | null;
}

interface AppBootstrapContextValue extends AppBootstrapState {
  refresh: (force?: boolean) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const EMPTY_STATE: AppBootstrapState = {
  authUser: null,
  profile: null,
  currentUser: null,
  organization: null,
  avatarUrl: null,
  isAuthenticated: false,
  isLoading: true,
  hasResolved: false,
  error: null,
};

const AppBootstrapContext = createContext<AppBootstrapContextValue | undefined>(undefined);

let cachedState: AppBootstrapState | null = null;
let inFlightBootstrap: Promise<AppBootstrapState> | null = null;
let cachedOrganization: { id: string; value: Organization | null } | null = null;

function createCurrentUser(profile: BootstrapProfile | null): CurrentUser | null {
  if (!profile || profile.is_approved === false) {
    return null;
  }

  return {
    id: profile.id,
    is_admin: profile.is_admin || false,
    assigned_pracas: profile.assigned_pracas || [],
    role: profile.role || 'user',
    organization_id: profile.organization_id || null,
  };
}

async function fetchProfileWithRetry(): Promise<BootstrapProfile | null> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error } = await safeRpc<BootstrapProfile>('get_current_user_profile', {}, {
        timeout: 10000,
        validateParams: false,
      });

      if (!error && data) {
        return data;
      }

      lastError = error;
    } catch (error) {
      lastError = error;
    }

    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (IS_DEV && lastError) {
    safeLog.warn('[AppBootstrap] Falha ao carregar perfil:', lastError);
  }

  return null;
}

async function resolveOrganization(organizationId: string | null): Promise<Organization | null> {
  if (!organizationId) {
    return null;
  }

  if (cachedOrganization?.id === organizationId) {
    return cachedOrganization.value;
  }

  try {
    const organization = await fetchOrganizationData(organizationId);
    cachedOrganization = { id: organizationId, value: organization };
    return organization;
  } catch (error) {
    if (IS_DEV) {
      safeLog.warn('[AppBootstrap] Falha ao carregar organizacao:', error);
    }
    cachedOrganization = { id: organizationId, value: null };
    return null;
  }
}

function buildSnapshot(authUser: User | null, profile: BootstrapProfile | null, organization: Organization | null, error: string | null): AppBootstrapState {
  const avatarUrl = profile?.avatar_url
    || authUser?.user_metadata?.avatar_url
    || authUser?.user_metadata?.picture
    || null;

  return {
    authUser,
    profile,
    currentUser: createCurrentUser(profile),
    organization,
    avatarUrl,
    isAuthenticated: !!authUser,
    isLoading: false,
    hasResolved: true,
    error,
  };
}

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

      const profile = await fetchProfileWithRetry();
      const organizationId = profile?.organization_id
        || authUser.user_metadata?.organization_id
        || null;
      const organization = await resolveOrganization(organizationId);

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
