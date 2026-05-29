import { createClient } from '@/utils/supabase/server';
import { loadAuthenticatedUser } from './authenticatedUser';

export type CurrentUserProfile = {
  id?: string;
  role?: string;
  is_admin?: boolean;
  is_approved?: boolean;
  organization_id?: string | null;
};

type ProfileFailure = {
  status: 401 | 403;
  message: string;
};

type LoadCurrentUserProfileOptions = {
  requireApproved?: boolean;
  requireElevatedRole?: boolean;
  unauthenticatedMessage?: string;
  missingProfileMessage?: string;
  notApprovedMessage?: string;
  forbiddenMessage?: string;
};

type LoadCurrentUserProfileResult =
  | { profile: CurrentUserProfile }
  | { failure: ProfileFailure };

export function normalizeCurrentUserProfile(profile: unknown): CurrentUserProfile | null {
  if (Array.isArray(profile)) {
    return (profile[0] as CurrentUserProfile) || null;
  }

  return (profile as CurrentUserProfile) || null;
}

export function hasElevatedRole(profile: CurrentUserProfile) {
  const role = String(profile.role || '').toLowerCase();
  return profile.is_admin === true || role === 'admin' || role === 'master';
}

export async function loadCurrentUserProfile(
  options: LoadCurrentUserProfileOptions = {}
): Promise<LoadCurrentUserProfileResult> {
  const {
    requireApproved = false,
    requireElevatedRole = false,
    unauthenticatedMessage = 'Usuario nao autenticado.',
    missingProfileMessage = 'Nao foi possivel validar o perfil do usuario.',
    notApprovedMessage = 'Usuario ainda nao aprovado.',
    forbiddenMessage = 'Usuario sem permissao administrativa.',
  } = options;

  const auth = await loadAuthenticatedUser(unauthenticatedMessage);
  if ('failure' in auth) {
    return { failure: auth.failure };
  }

  const supabase = createClient();
  const { data: profileData, error: profileError } = await supabase.rpc('get_current_user_profile');
  const profile = normalizeCurrentUserProfile(profileData);

  if (profileError || !profile) {
    return {
      failure: {
        status: 403,
        message: missingProfileMessage,
      },
    };
  }

  if (requireApproved && profile.is_approved !== true) {
    return {
      failure: {
        status: 403,
        message: notApprovedMessage,
      },
    };
  }

  if (requireElevatedRole && !hasElevatedRole(profile)) {
    return {
      failure: {
        status: 403,
        message: forbiddenMessage,
      },
    };
  }

  return { profile };
}
