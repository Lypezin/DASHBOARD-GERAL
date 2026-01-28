/**
 * Hook para gerenciar avatar do usuário no Header
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';
import { UserProfile } from './useHeaderAuth';

const IS_DEV = process.env.NODE_ENV === 'development';

export function useHeaderAvatar(user: UserProfile | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }

    const fetchAvatar = async () => {
      try {
        const { data: profileData, error: profileDataError } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (!profileDataError && profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        } else if (user.avatar_url) {
          setAvatarUrl(user.avatar_url);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        if (IS_DEV) safeLog.warn('Não foi possível carregar avatar:', err);
        setAvatarUrl(user.avatar_url || null);
      }
    };

    fetchAvatar();
  }, [user?.id, user?.avatar_url]);

  return avatarUrl;
}

