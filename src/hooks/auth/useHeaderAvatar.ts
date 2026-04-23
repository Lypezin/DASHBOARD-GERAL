import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from './useHeaderAuth';

export function useHeaderAvatar(user: UserProfile | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);

  useEffect(() => {
    setAvatarUrl(user?.avatar_url || null);
  }, [user?.avatar_url, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const loadAvatar = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled || error) return;
      setAvatarUrl(data?.avatar_url || user?.avatar_url || null);
    };

    void loadAvatar();

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatar_url?: string | null }>;
      if (typeof customEvent.detail?.avatar_url !== 'undefined') {
        setAvatarUrl(customEvent.detail.avatar_url || null);
      } else {
        void loadAvatar();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      }
    };
  }, [user?.avatar_url, user?.id]);

  return avatarUrl;
}
