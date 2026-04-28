import { useState, useEffect, useRef, useMemo } from 'react';
import { useOnlineUsers, OnlineUser, ChatMessage } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { useChatPersistence } from './hooks/useChatPersistence';
import { formatTimeOnline } from './utils';
import { supabase } from '@/lib/supabaseClient';

function shouldSyncActiveChatUser(current: OnlineUser, next: OnlineUser) {
    return (
        current.name !== next.name ||
        current.avatar_url !== next.avatar_url ||
        current.role !== next.role ||
        current.current_tab !== next.current_tab ||
        current.device !== next.device ||
        current.is_idle !== next.is_idle ||
        current.custom_status !== next.custom_status ||
        current.last_typed !== next.last_typed ||
        current.typing_to !== next.typing_to ||
        current.online_at !== next.online_at
    );
}

export function useSidebarController(
    currentUser: CurrentUser | null,
    currentTab: string,
    initialOpen = false,
    preloadRealtime = false
) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [hasActivatedRealtime, setHasActivatedRealtime] = useState(initialOpen || preloadRealtime);

    const onlineUsersData = useOnlineUsers(currentUser, currentTab, hasActivatedRealtime, isOpen);
    const { onlineUsers, messages, joinedUsers, clearJoinedUsers } = onlineUsersData;

    const [searchTerm, setSearchTerm] = useState('');
    const [myCustomStatus, setMyCustomStatus] = useState('');
    const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({});

    const [activeChatUser, setActiveChatUser] = useState<OnlineUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previousScrollKeyRef = useRef<string | null>(null);
    const avatarLookupAttemptedRef = useRef<Set<string>>(new Set());

    const { unreadCounts } = useChatPersistence(currentUser, messages, activeChatUser);

    useEffect(() => {
        if (isOpen && !hasActivatedRealtime) {
            setHasActivatedRealtime(true);
        }
    }, [hasActivatedRealtime, isOpen]);

    useEffect(() => {
        if (preloadRealtime && !hasActivatedRealtime) {
            setHasActivatedRealtime(true);
        }
    }, [hasActivatedRealtime, preloadRealtime]);

    useEffect(() => {
        if (joinedUsers.length === 0) return;
        // Presence now starts in background, so join toasts become noisy and misleading.
        clearJoinedUsers();
    }, [joinedUsers, clearJoinedUsers]);

    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick((tick) => tick + 1), 60000);
        return () => clearInterval(interval);
    }, []);

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

    useEffect(() => {
        if (!activeChatUser) {
            return;
        }

        const latestActiveUser = hydratedOnlineUsers.find((user) => user.id === activeChatUser.id);
        if (!latestActiveUser) {
            return;
        }

        setActiveChatUser((prev) => (
            prev && prev.id === latestActiveUser.id && shouldSyncActiveChatUser(prev, latestActiveUser)
                ? { ...prev, ...latestActiveUser }
                : prev
        ));
    }, [activeChatUser, hydratedOnlineUsers]);

    const activeMessages = useMemo(() => (
        activeChatUser
            ? messages.filter((message) =>
                (message.from === activeChatUser.id && message.to === currentUser?.id) ||
                (message.from === currentUser?.id && message.to === activeChatUser.id)
            )
            : []
    ), [activeChatUser, currentUser?.id, messages]);

    const activeChatScrollKey = useMemo(() => {
        if (!activeChatUser) {
            return null;
        }

        const lastMessage = activeMessages[activeMessages.length - 1];
        return `${activeChatUser.id}:${lastMessage?.id || 'empty'}:${activeMessages.length}`;
    }, [activeChatUser, activeMessages]);

    useEffect(() => {
        if (!activeChatUser || !chatEndRef.current || !activeChatScrollKey) {
            previousScrollKeyRef.current = activeChatScrollKey;
            return;
        }

        const previousKey = previousScrollKeyRef.current;
        const hasSwitchedChat = !previousKey || !previousKey.startsWith(`${activeChatUser.id}:`);
        previousScrollKeyRef.current = activeChatScrollKey;

        chatEndRef.current.scrollIntoView({
            behavior: hasSwitchedChat ? 'auto' : 'smooth',
            block: 'end',
        });
    }, [activeChatScrollKey, activeChatUser]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase();
        return hydratedOnlineUsers.filter((user: OnlineUser) =>
            user.name?.toLowerCase().includes(normalizedSearch) ||
            user.role?.toLowerCase().includes(normalizedSearch)
        );
    }, [hydratedOnlineUsers, searchTerm]);

    const totalUnread = useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + b, 0), [unreadCounts]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChatUser) return;

        const { uploadFile, sendMessage } = onlineUsersData;
        const upload = await uploadFile(file);

        if (upload) {
            await sendMessage(activeChatUser.id, '', {
                attachments: [upload]
            });
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return {
        isOpen,
        setIsOpen,
        hasActivatedRealtime,
        onlineUsersData,
        searchTerm,
        setSearchTerm,
        myCustomStatus,
        setMyCustomStatus,
        activeChatUser,
        setActiveChatUser,
        chatInput,
        setChatInput,
        replyingTo,
        setReplyingTo,
        chatEndRef,
        unreadCounts,
        fileInputRef,
        activeMessages,
        filteredUsers,
        formatTimeOnline,
        totalUnread,
        onlineUsers: hydratedOnlineUsers,
        handleFileUpload
    };
}
