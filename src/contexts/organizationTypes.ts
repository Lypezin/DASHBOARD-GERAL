export interface Organization {
  id: string;
  name: string;
  slug: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
}
