import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

import { fetchUserProfile, fetchUserAvatar } from './profileService';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export const usePerfilData = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const { authUser, profile, error: profileError } = await fetchUserProfile();

      if (!authUser) {
        router.push('/login');
        return;
      }

      if (profileError) throw profileError;

      if (!profile?.is_approved) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      let fullName = profile.full_name;
      if (!fullName || fullName.trim() === '') {
        fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.fullName || authUser.email?.split('@')[0] || 'Usuário';
      }

      const updatedProfile = { ...profile, full_name: fullName };
      setUser(updatedProfile);

      // Set member since from auth first
      if (authUser?.created_at) {
        setMemberSince(authUser.created_at);
      }

      // Fetch Avatar and additional dates
      if (profile?.id) {
        const { avatarUrl, createdAt } = await fetchUserAvatar(profile.id);

        if (avatarUrl) {
          setUser(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
        }

        // Fallback date if auth date missing
        if (!authUser?.created_at && createdAt) {
          setMemberSince(createdAt);
        }
      }
    } catch (err) {
      safeLog.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return {
    user,
    loading,
    memberSince,
    refreshUser: checkUser,
  };
};

