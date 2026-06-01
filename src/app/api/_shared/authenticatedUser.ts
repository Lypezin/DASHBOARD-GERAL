import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

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
  | { user: AuthenticatedUser }
  | { failure: AuthenticatedUserFailure };

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
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (!userError && userData.user) {
    return {
      user: userData.user as AuthenticatedUser,
    };
  }

  const bearerToken = getBearerToken();
  if (bearerToken) {
    const { data: bearerUserData, error: bearerUserError } = await supabase.auth.getUser(bearerToken);

    if (!bearerUserError && bearerUserData.user) {
      return {
        user: bearerUserData.user as AuthenticatedUser,
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
