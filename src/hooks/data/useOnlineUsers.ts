import { useMemo } from 'react';
import { CurrentUser } from '@/types';
import { useIdleDetection } from '@/hooks/online/useIdleDetection';
import { usePresence } from '@/hooks/online/usePresence';
import { useChat } from '@/hooks/online/useChat';
import { OnlineUser, ChatMessage } from '@/hooks/online/types';

export type { OnlineUser, ChatMessage };

export function useOnlineUsers(currentUser: CurrentUser | null, currentTab: string, enabled: boolean) {
    const userId = useMemo(() => currentUser?.id ?? null, [currentUser?.id]);
    const isIdle = useIdleDetection(5, enabled);

    const presence = usePresence(userId, currentUser, currentTab, isIdle, enabled);
    const chat = useChat(userId, enabled);

    return {
        onlineUsers: presence.onlineUsers,
        joinedUsers: presence.joinedUsers,
        clearJoinedUsers: presence.clearJoinedUsers,
        setCustomStatus: presence.setCustomStatus,
        setTypingTo: presence.setTypingTo,
        messages: chat.messages,
        sendMessage: chat.sendMessage,
        reactToMessage: chat.reactToMessage,
        pinMessage: chat.pinMessage,
        uploadFile: chat.uploadFile
    };
}
