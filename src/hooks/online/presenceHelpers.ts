import { OnlineUser } from './types';

export function getPresenceRecency(user: OnlineUser) {
    const lastActivity = user.last_typed || user.online_at;
    const parsedDate = lastActivity ? Date.parse(lastActivity) : 0;
    return Number.isFinite(parsedDate) ? parsedDate : 0;
}

export function normalizePresenceUsers(state: Record<string, OnlineUser[]>) {
    const uniqueUsers = new Map<string, OnlineUser>();

    for (const key in state) {
        const presences = state[key];
        if (!presences?.length) {
            continue;
        }

        for (const presence of presences) {
            if (!presence?.id) {
                continue;
            }

            const current = uniqueUsers.get(presence.id);
            if (!current || getPresenceRecency(presence) >= getPresenceRecency(current)) {
                uniqueUsers.set(presence.id, presence);
            }
        }
    }

    return [...uniqueUsers.values()].sort((a, b) => {
        if (!!a.is_idle !== !!b.is_idle) {
            return a.is_idle ? 1 : -1;
        }

        return (a.name || '').localeCompare(b.name || '');
    });
}

export function isSameOnlineUsers(previousUsers: OnlineUser[], nextUsers: OnlineUser[]) {
    if (previousUsers.length !== nextUsers.length) {
        return false;
    }

    return previousUsers.every((previousUser, index) => {
        const nextUser = nextUsers[index];
        return (
            previousUser.id === nextUser.id &&
            previousUser.name === nextUser.name &&
            previousUser.avatar_url === nextUser.avatar_url &&
            previousUser.role === nextUser.role &&
            previousUser.current_tab === nextUser.current_tab &&
            previousUser.is_idle === nextUser.is_idle &&
            previousUser.custom_status === nextUser.custom_status &&
            previousUser.typing_to === nextUser.typing_to &&
            previousUser.last_typed === nextUser.last_typed
        );
    });
}
