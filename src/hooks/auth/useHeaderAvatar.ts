import { useAppBootstrap } from '@/contexts/AppBootstrapContext';
import { UserProfile } from './useHeaderAuth';

export function useHeaderAvatar(user: UserProfile | null) {
  const { avatarUrl } = useAppBootstrap();
  return avatarUrl || user?.avatar_url || null;
}
