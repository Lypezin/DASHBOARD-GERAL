export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    is_admin: boolean;
    is_approved: boolean;
    avatar_url?: string | null;
    organization_id?: string | null;
}
