import { loadAuthenticatedUser } from './authenticatedUser';
import { createServiceRoleClient } from '@/utils/supabase/admin';

export type CurrentUserProfile = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: string;
  is_admin?: boolean;
  is_approved?: boolean;
  organization_id?: string | null;
  assigned_pracas?: string[] | null;
  avatar_url?: string | null;
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

function normalizeProfileRow(profile: CurrentUserProfile | null): CurrentUserProfile | null {
  if (!profile) return null;

  const role = String(profile.role || '').toLowerCase();

  return {
    ...profile,
    is_admin: profile.is_admin === true || role === 'admin' || role === 'master',
    assigned_pracas: Array.isArray(profile.assigned_pracas) ? profile.assigned_pracas : [],
  };
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

  const admin = createServiceRoleClient();
  const { data: profileData, error: profileError } = await admin
    .from('user_profiles')
    .select('id, email, full_name, role, is_admin, is_approved, organization_id, assigned_pracas, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();
  const profile = normalizeProfileRow(normalizeCurrentUserProfile(profileData));

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
