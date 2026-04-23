import { OnlineUser } from '@/hooks/data/useOnlineUsers';

export function buildProfileHref(user: OnlineUser, currentUserId: string) {
    if (user.id === currentUserId) return '/perfil';

    const params = new URLSearchParams();
    if (user.name) params.set('name', user.name);
    if (user.avatar_url) params.set('avatar', user.avatar_url);
    if (user.role) params.set('role', user.role);
    if (user.custom_status) params.set('status', user.custom_status);
    if (user.current_tab) params.set('tab', user.current_tab);
    if (user.online_at) params.set('onlineAt', user.online_at);
    if (user.is_idle) params.set('idle', '1');

    return `/perfil/${user.id}?${params.toString()}`;
}
