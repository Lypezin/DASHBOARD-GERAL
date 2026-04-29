import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';

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

            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, avatar_url')
                .in('id', missingAvatarUserIds)
                .not('avatar_url', 'is', null);

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
