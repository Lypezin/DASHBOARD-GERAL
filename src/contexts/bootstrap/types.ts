import type { User } from '@supabase/supabase-js';
import type { CurrentUser } from '@/types';
import type { UserProfile } from '@/hooks/auth/types';
import type { Organization } from '../organizationTypes';

export type BootstrapProfile = UserProfile & {
  assigned_pracas?: string[];
};

export interface AppBootstrapState {
  authUser: User | null;
  profile: BootstrapProfile | null;
  currentUser: CurrentUser | null;
  organization: Organization | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasResolved: boolean;
  error: string | null;
}

export interface AppBootstrapContextValue extends AppBootstrapState {
  refresh: (force?: boolean) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export const EMPTY_STATE: AppBootstrapState = {
  authUser: null,
  profile: null,
  currentUser: null,
  organization: null,
  avatarUrl: null,
  isAuthenticated: false,
  isLoading: true,
  hasResolved: false,
  error: null,
};
