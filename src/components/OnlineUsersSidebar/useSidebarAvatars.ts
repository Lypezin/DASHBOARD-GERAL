import { useState, useEffect, useRef, useMemo } from 'react';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { postAppApiData } from '@/utils/app/fetchAppApi';

export function useSidebarAvatars(onlineUsers: OnlineUser[]) {
    const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({});
    const avatarLookupAttemptedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const missingAvatarUserIds = onlineUsers
            .filter((user) => !user.avatar_url && !avatarOverrides[user.id] && !avatarLookupAttemptedRef.current.has(user.id))
            .map((user) => user.id);

        if (missingAvatarUserIds.length === 0) {
            return;
        }

        let isCancelled = false;

        const hydrateMissingAvatars = async () => {
            missingAvatarUserIds.forEach((userId) => {
                avatarLookupAttemptedRef.current.add(userId);
            });

            const { data, error } = await postAppApiData<Array<{ id: string; avatar_url: string | null }>>(
                '/api/profile/avatars',
                { ids: missingAvatarUserIds }
            );

            if (isCancelled || error || !data?.length) {
                return;
            }

            setAvatarOverrides((prev) => {
                const next = { ...prev };
                let hasChanges = false;

                for (const profile of data) {
                    if (profile.avatar_url && next[profile.id] !== profile.avatar_url) {
                        next[profile.id] = profile.avatar_url;
                        hasChanges = true;
                    }
                }

                return hasChanges ? next : prev;
            });
        };

        void hydrateMissingAvatars();

        return () => {
            isCancelled = true;
        };
    }, [avatarOverrides, onlineUsers]);

    const hydratedOnlineUsers = useMemo(() => (
        onlineUsers.map((user) => {
            const hydratedAvatarUrl = avatarOverrides[user.id];
            if (!hydratedAvatarUrl || user.avatar_url) {
                return user;
            }

            return {
                ...user,
                avatar_url: hydratedAvatarUrl,
            };
        })
    ), [avatarOverrides, onlineUsers]);

    return { hydratedOnlineUsers, avatarOverrides };
}
