export interface PublicProfileData {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    created_at?: string | null;
    role?: string | null;
    custom_status?: string | null;
    current_tab?: string | null;
    online_at?: string | null;
    is_idle?: boolean;
}
