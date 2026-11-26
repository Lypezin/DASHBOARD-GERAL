import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { getTimedCacheValue, setTimedCacheValue, type TimedCacheEntry } from '@/utils/cache/timedLruCache';

export type AuthenticatedUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type AuthenticatedUserFailure = {
  status: 401;
  message: string;
};

type LoadAuthenticatedUserResult =
  | { user: AuthenticatedUser; accessToken?: string }
  | { failure: AuthenticatedUserFailure };

const AUTHENTICATED_USER_CACHE_TTL_MS = 60_000;
const AUTHENTICATED_USER_CACHE_POLICY = { ttlMs: AUTHENTICATED_USER_CACHE_TTL_MS, maxEntries: 512 } as const;
const authenticatedUserCache = new Map<string, TimedCacheEntry<AuthenticatedUser>>();
const inFlightAuthenticatedUserRequests = new Map<string, Promise<AuthenticatedUser | null>>();

async function resolveCachedAuthenticatedUser(
  cacheKey: string,
  fetcher: () => Promise<AuthenticatedUser | null>
): Promise<AuthenticatedUser | null> {
  const cached = getTimedCacheValue(authenticatedUserCache, cacheKey, AUTHENTICATED_USER_CACHE_POLICY);
  if (cached) return cached;

  const existingRequest = inFlightAuthenticatedUserRequests.get(cacheKey);
  const user = existingRequest
    ? await existingRequest
    : await (async () => {
      const request = fetcher().finally(() => {
        inFlightAuthenticatedUserRequests.delete(cacheKey);
      });

      inFlightAuthenticatedUserRequests.set(cacheKey, request);
      return request;
    })();

  if (user) {
    setTimedCacheValue(authenticatedUserCache, cacheKey, user, AUTHENTICATED_USER_CACHE_POLICY);
  }

  return user;
}

function getBearerToken() {
  const authorization = headers().get('authorization');
  if (!authorization) return null;

  const [scheme, ...tokenParts] = authorization.split(' ');
  const token = tokenParts.join(' ').trim();

  if (scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function loadAuthenticatedUser(
  unauthenticatedMessage = 'Usuario nao autenticado.'
): Promise<LoadAuthenticatedUserResult> {
  let supabase: ReturnType<typeof createClient> | null = null;
  const getSupabase = () => {
    if (!supabase) {
      supabase = createClient();
    }
    return supabase;
  };
  const bearerToken = getBearerToken();

  if (bearerToken) {
    const user = await resolveCachedAuthenticatedUser(bearerToken, async () => {
      const { data: bearerUserData, error: bearerUserError } = await getSupabase().auth.getUser(bearerToken);
      if (bearerUserError || !bearerUserData.user) {
        return null;
      }
      return bearerUserData.user as AuthenticatedUser;
    });

    if (user) {
      return {
        user,
        accessToken: bearerToken,
      };
    }
  }

  const { data: sessionData } = await getSupabase().auth.getSession();
  const sessionToken = sessionData.session?.access_token;

  if (sessionToken) {
    const user = await resolveCachedAuthenticatedUser(`session:${sessionToken}`, async () => {
      const { data: userData, error: userError } = await getSupabase().auth.getUser();
      if (userError || !userData.user) {
        return null;
      }
      return userData.user as AuthenticatedUser;
    });

    if (user) {
      return {
        user,
        accessToken: sessionData.session?.user.id === user.id ? sessionToken : undefined,
      };
    }
  } else {
    const { data: userData, error: userError } = await getSupabase().auth.getUser();

    if (!userError && userData.user) {
      return {
        user: userData.user as AuthenticatedUser,
      };
    }
  }

  return {
    failure: {
      status: 401,
      message: unauthenticatedMessage,
    },
  };
}
