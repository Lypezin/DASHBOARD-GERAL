import { useMemo } from 'react';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { UserProfile } from './useHeaderAuth';

export function useHeaderAvatar(user: UserProfile | null) {
  const { authUser, avatarUrl } = useAppBootstrap();

  const resolvedAvatarUrl = useMemo(
    () => avatarUrl || user?.avatar_url || authUser?.user_metadata?.avatar_url as string || authUser?.user_metadata?.picture as string || null,
    [authUser?.user_metadata?.avatar_url, authUser?.user_metadata?.picture, avatarUrl, user?.avatar_url]
  );

  return resolvedAvatarUrl;
}
