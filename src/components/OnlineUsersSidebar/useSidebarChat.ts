import { useState, useEffect, useRef, useMemo } from 'react';
import { OnlineUser, ChatMessage } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';

export function shouldSyncActiveChatUser(current: OnlineUser, next: OnlineUser) {
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

export function useSidebarChat(
    hydratedOnlineUsers: OnlineUser[],
    messages: ChatMessage[],
    currentUser: CurrentUser | null
) {
    const [activeChatUser, setActiveChatUser] = useState<OnlineUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previousScrollKeyRef = useRef<string | null>(null);

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

    return {
        activeChatUser,
        setActiveChatUser,
        chatInput,
        setChatInput,
        replyingTo,
        setReplyingTo,
        chatEndRef,
        fileInputRef,
        activeMessages
    };
}
