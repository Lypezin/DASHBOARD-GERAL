import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { UserProfile } from './useHeaderAuth';

export function useHeaderAvatar(user: UserProfile | null) {
  const { authUser, avatarUrl } = useAppBootstrap();
  const [hydratedAvatarUrl, setHydratedAvatarUrl] = useState<string | null>(null);

  const resolvedUserId = user?.id || authUser?.id || null;
  const resolvedAvatarUrl = useMemo(
    () => avatarUrl || user?.avatar_url || hydratedAvatarUrl || null,
    [avatarUrl, hydratedAvatarUrl, user?.avatar_url]
  );

  useEffect(() => {
    if (!resolvedUserId || resolvedAvatarUrl) {
      return;
    }

    let isCancelled = false;

    const loadAvatarUrl = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', resolvedUserId)
        .single();

      if (!isCancelled && !error && data?.avatar_url) {
        setHydratedAvatarUrl(data.avatar_url);
      }
    };

    void loadAvatarUrl();

    return () => {
      isCancelled = true;
    };
  }, [resolvedAvatarUrl, resolvedUserId]);

  return resolvedAvatarUrl;
}
