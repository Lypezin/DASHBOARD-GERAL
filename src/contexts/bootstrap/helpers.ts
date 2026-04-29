import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { safeRpc } from '@/lib/rpcWrapper';
import type { CurrentUser } from '@/types';
import { fetchOrganizationData } from '../hooks/organizationDataHelper';
import type { Organization } from '../organizationTypes';
import type { BootstrapProfile, AppBootstrapState } from './types';

const IS_DEV = process.env.NODE_ENV === 'development';

export function createCurrentUser(profile: BootstrapProfile | null): CurrentUser | null {
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

export async function fetchProfileWithRetry(): Promise<BootstrapProfile | null> {
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

export async function hydrateAvatarUrl(
  authUser: User,
  profile: BootstrapProfile | null
): Promise<BootstrapProfile | null> {
  if (!authUser || !profile || profile.avatar_url) {
    return profile;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', authUser.id)
      .single();

    if (!error && data?.avatar_url) {
      return {
        ...profile,
        avatar_url: data.avatar_url,
      };
    }
  } catch (error) {
    if (IS_DEV) {
      safeLog.warn('[AppBootstrap] Falha ao hidratar avatar_url do perfil:', error);
    }
  }

  return profile;
}

export async function resolveOrganization(
  organizationId: string | null,
  cachedOrganization: { id: string; value: Organization | null } | null,
  setCache: (cache: { id: string; value: Organization | null } | null) => void
): Promise<Organization | null> {
  if (!organizationId) {
    return null;
  }

  if (cachedOrganization?.id === organizationId) {
    return cachedOrganization.value;
  }

  try {
    const organization = await fetchOrganizationData(organizationId);
    setCache({ id: organizationId, value: organization });
    return organization;
  } catch (error) {
    if (IS_DEV) {
      safeLog.warn('[AppBootstrap] Falha ao carregar organizacao:', error);
    }
    setCache({ id: organizationId, value: null });
    return null;
  }
}

export function buildSnapshot(
  authUser: User | null, 
  profile: BootstrapProfile | null, 
  organization: Organization | null, 
  error: string | null
): AppBootstrapState {
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
