/**
 * Hook para gerenciar autenticacao e perfil do usuario no Header
 */

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { safeLog } from '@/lib/errorHandler';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { UserProfile } from './types';
import { shouldSkipRedirect } from './utils/headerAuthSteps';

const IS_DEV = process.env.NODE_ENV === 'development';

export type { UserProfile };

export function useHeaderAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, profile, avatarUrl, isLoading, hasResolved, handleLogout } = useAppBootstrap();

  const user = useMemo<UserProfile | null>(() => {
    if (!profile) {
      return null;
    }

    return {
      ...profile,
      avatar_url: avatarUrl || profile.avatar_url || null
    };
  }, [avatarUrl, profile]);

  useEffect(() => {
    if (!hasResolved || shouldSkipRedirect(pathname)) {
      return;
    }

    if (!authUser) {
      if (IS_DEV) {
        safeLog.info('[HeaderAuth] Redirect to login from:', pathname);
      }

      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.push(`/login${search}`);
    }
  }, [authUser, hasResolved, pathname, router]);

  return {
    user,
    isLoading: isLoading && !hasResolved,
    hasTriedAuth: hasResolved,
    handleLogout,
  };
}
