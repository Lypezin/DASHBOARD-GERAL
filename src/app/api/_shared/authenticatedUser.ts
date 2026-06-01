import { createClient } from '@/utils/supabase/server';

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

export async function loadAuthenticatedUser(
  unauthenticatedMessage = 'Usuario nao autenticado.'
): Promise<LoadAuthenticatedUserResult> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      failure: {
        status: 401,
        message: unauthenticatedMessage,
      },
    };
  }

  return {
    user: userData.user as AuthenticatedUser,
  };
}
