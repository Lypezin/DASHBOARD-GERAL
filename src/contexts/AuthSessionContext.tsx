'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface AuthSessionContextValue {
  isLoading: boolean;
  session: Session | null;
  sessionUser: User | null;
  refreshSession: (verifyUser?: boolean) => Promise<{ session: Session | null; user: User | null }>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

const IS_DEV = process.env.NODE_ENV === 'development';

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  const refreshSession = useCallback(async (verifyUser = true) => {
    try {
      const { data: { session: nextSession } } = await supabase.auth.getSession();

      setSession(nextSession);
      setSessionUser(nextSession?.user ?? null);

      if (verifyUser && nextSession?.user) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setSessionUser(user);
          setIsLoading(false);
          return { session: nextSession, user };
        }
      }

      setIsLoading(false);
      return { session: nextSession, user: nextSession?.user ?? null };
    } catch (error) {
      if (IS_DEV) {
        safeLog.warn('[AuthSessionContext] Failed to refresh session:', error);
      }

      setSession(null);
      setSessionUser(null);
      setIsLoading(false);

      return { session: null, user: null };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;
      setIsLoading(true);
      await refreshSession(true);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;

      if (IS_DEV) {
        safeLog.info('[AuthSessionContext] Auth event:', event);
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setSessionUser(null);
        setIsLoading(false);
        return;
      }

      setSession(nextSession);
      setSessionUser(nextSession?.user ?? null);
      setIsLoading(false);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await refreshSession(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const value = useMemo<AuthSessionContextValue>(() => ({
    isLoading,
    session,
    sessionUser,
    refreshSession,
  }), [isLoading, refreshSession, session, sessionUser]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }

  return context;
}
