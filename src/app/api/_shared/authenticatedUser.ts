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

const AUTHENTICATED_USER_CACHE_TTL_MS = 10_000;
const AUTHENTICATED_USER_CACHE_POLICY = { ttlMs: AUTHENTICATED_USER_CACHE_TTL_MS, maxEntries: 512 } as const;
const authenticatedUserCache = new Map<string, TimedCacheEntry<AuthenticatedUser>>();
const inFlightAuthenticatedUserRequests = new Map<string, Promise<AuthenticatedUser | null>>();

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
  const supabase = createClient();
  const bearerToken = getBearerToken();

  if (bearerToken) {
    const cached = getTimedCacheValue(authenticatedUserCache, bearerToken, AUTHENTICATED_USER_CACHE_POLICY);
    if (cached) return { user: cached, accessToken: bearerToken };

    const existingRequest = inFlightAuthenticatedUserRequests.get(bearerToken);
    const user = existingRequest
      ? await existingRequest
      : await (async () => {
        const request = (async () => {
          const { data: bearerUserData, error: bearerUserError } = await supabase.auth.getUser(bearerToken);

          if (bearerUserError || !bearerUserData.user) {
            return null;
          }

          return bearerUserData.user as AuthenticatedUser;
        })().finally(() => {
          inFlightAuthenticatedUserRequests.delete(bearerToken);
        });

        inFlightAuthenticatedUserRequests.set(bearerToken, request);
        return request;
      })();

    if (user) {
      setTimedCacheValue(authenticatedUserCache, bearerToken, user, AUTHENTICATED_USER_CACHE_POLICY);

      return {
        user,
        accessToken: bearerToken,
      };
    }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (!userError && userData.user) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.user.id === userData.user.id
      ? sessionData.session.access_token
      : undefined;

    return {
      user: userData.user as AuthenticatedUser,
      accessToken,
    };
  }

  return {
    failure: {
      status: 401,
      message: unauthenticatedMessage,
    },
  };
}
