import { UserProfile } from './useHeaderAuth';

export function useHeaderAvatar(user: UserProfile | null) {
  return user?.avatar_url || null;
}
