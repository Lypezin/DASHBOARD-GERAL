import { loadAuthenticatedUser } from './authenticatedUser';
import { createServiceRoleClient } from '@/utils/supabase/admin';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { safeLog } from '@/lib/errorHandler';
import { getTimedCacheValue, setTimedCacheValue, type TimedCacheEntry } from '@/utils/cache/timedLruCache';

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
  status: 400 | 401 | 403 | 503;
  message: string;
  code?: string;
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

const PROFILE_SELECT = 'id, email, full_name, role, is_admin, is_approved, organization_id, assigned_pracas, avatar_url, created_at, updated_at';
const PROFILE_CACHE_TTL_MS = 10_000;
const PROFILE_CACHE_POLICY = { ttlMs: PROFILE_CACHE_TTL_MS, maxEntries: 512 } as const;
const profileCache = new Map<string, TimedCacheEntry<CurrentUserProfile>>();
const inFlightProfileRequests = new Map<string, Promise<{ profile: CurrentUserProfile | null; error: unknown }>>();

function createSessionProfileClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) {
    throw new Error('A configuração pública do Supabase não está completa no servidor.');
  }

  return createSupabaseClient(supabaseUrl, anonKey, {
    // Supabase JS overwrites a global Authorization header with the API key
    // when no session is stored. accessToken binds PostgREST to the caller JWT.
    accessToken: async () => accessToken,
  });
}

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

  const cachedProfile = getTimedCacheValue(profileCache, auth.user.id, PROFILE_CACHE_POLICY);
  if (cachedProfile) {
    const profile = cachedProfile;
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

  const existingProfileRequest = inFlightProfileRequests.get(auth.user.id);
  const profileResult = existingProfileRequest
    ? await existingProfileRequest
    : await (async () => {
      // Keep this read under the caller's own RLS scope. Login validation
      // must work without a service-role secret in local development.
      const profileClient = auth.accessToken
        ? createSessionProfileClient(auth.accessToken)
        : createServiceRoleClient();
      const request = (async () => {
        const { data: profileData, error } = await profileClient
          .from('user_profiles')
          .select(PROFILE_SELECT)
          .eq('id', auth.user.id)
          .maybeSingle();

        return {
          profile: normalizeProfileRow(normalizeCurrentUserProfile(profileData)),
          error,
        };
      })().finally(() => {
        inFlightProfileRequests.delete(auth.user.id);
      });

      inFlightProfileRequests.set(auth.user.id, request);
      return request;
    })();
  const profileError = profileResult.error;
  const profile = profileResult.profile;

  if (profileError || !profile) {
    if (profileError) {
      safeLog.error('Falha ao consultar user_profiles para o usuário autenticado:', profileError);
      return {
        failure: {
          status: 503,
          code: 'PROFILE_QUERY_FAILED',
          message: 'Não foi possível consultar o perfil agora. Tente novamente.',
        },
      };
    }

    if (!profileError) {
      const admin = createServiceRoleClient();
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
        .select(PROFILE_SELECT)
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
          .select(PROFILE_SELECT)
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

  setTimedCacheValue(profileCache, auth.user.id, profile, PROFILE_CACHE_POLICY);

  return { profile };
}
