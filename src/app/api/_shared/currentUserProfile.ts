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
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileFailure = {
  status: 400 | 401 | 403;
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveAuthorizedOrganizationId(
  profile: CurrentUserProfile,
  requestedOrganizationId: unknown,
  messages: { invalid?: string; forbidden?: string } = {}
): { organizationId: string } | { failure: ProfileFailure } {
  const profileOrganizationId = profile.organization_id || null;
  const requestedId =
    typeof requestedOrganizationId === 'string' && UUID_RE.test(requestedOrganizationId)
      ? requestedOrganizationId
      : null;
  const organizationId = requestedId || profileOrganizationId;

  if (!organizationId || !UUID_RE.test(organizationId)) {
    return {
      failure: {
        status: 400,
        message: messages.invalid || 'Organizacao invalida para consulta.',
      },
    };
  }

  if (!hasElevatedRole(profile) && (!profileOrganizationId || organizationId !== profileOrganizationId)) {
    return {
      failure: {
        status: 403,
        message: messages.forbidden || 'Organizacao nao permitida para este usuario.',
      },
    };
  }

  return { organizationId };
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
    .select('id, email, full_name, role, is_admin, is_approved, organization_id, assigned_pracas, avatar_url, created_at, updated_at')
    .eq('id', auth.user.id)
    .maybeSingle();
  const profile = normalizeProfileRow(normalizeCurrentUserProfile(profileData));

  if (profileError || !profile) {
    if (!profileError) {
      const metadata = auth.user.user_metadata || {};
      const fullName =
        typeof metadata.full_name === 'string' && metadata.full_name.trim()
          ? metadata.full_name.trim()
          : typeof metadata.fullName === 'string' && metadata.fullName.trim()
            ? metadata.fullName.trim()
            : typeof metadata.name === 'string' && metadata.name.trim()
              ? metadata.name.trim()
              : auth.user.id;

      const { data: createdProfile, error: createError } = await admin
        .from('user_profiles')
        .insert({
          id: auth.user.id,
          email: typeof auth.user.email === 'string' ? auth.user.email : null,
          full_name: fullName,
          is_admin: false,
          is_approved: false,
          assigned_pracas: [],
          role: 'user',
        })
        .select('id, email, full_name, role, is_admin, is_approved, organization_id, assigned_pracas, avatar_url, created_at, updated_at')
        .maybeSingle();

      const normalizedCreatedProfile = normalizeProfileRow(normalizeCurrentUserProfile(createdProfile));

      if (!createError && normalizedCreatedProfile) {
        if (requireApproved) {
          return {
            failure: {
              status: 403,
              message: notApprovedMessage,
            },
          };
        }

        return { profile: normalizedCreatedProfile };
      }

      if (createError?.code === '23505') {
        const { data: racedProfile } = await admin
          .from('user_profiles')
          .select('id, email, full_name, role, is_admin, is_approved, organization_id, assigned_pracas, avatar_url, created_at, updated_at')
          .eq('id', auth.user.id)
          .maybeSingle();

        const normalizedRacedProfile = normalizeProfileRow(normalizeCurrentUserProfile(racedProfile));
        if (normalizedRacedProfile) {
          if (requireApproved && normalizedRacedProfile.is_approved !== true) {
            return {
              failure: {
                status: 403,
                message: notApprovedMessage,
              },
            };
          }

          return { profile: normalizedRacedProfile };
        }
      }
    }

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
