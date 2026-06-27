import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserProfileData } from '@/utils/app/fetchAppApi';
import { UserProfile } from './usePerfilData';

export async function fetchUserProfile() {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { authUser: null, profile: null, error: null };

  const { data: profile, error: profileError } = await getCurrentUserProfileData<UserProfile>();

  return { authUser, profile, error: profileError };
}

export async function fetchUserAvatar(profile: UserProfile | null) {
  if (!profile) return { avatarUrl: null, createdAt: null, error: null };

  return {
    avatarUrl: profile.avatar_url || null,
    createdAt: profile.created_at || null,
    error: null,
  };
}
