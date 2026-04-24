import { useState } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { ChatMessage } from './types';
import { chatService } from './services/chatService';
import { useChatSubscription } from './useChatSubscription';

export function useChat(userId: string | null, enabled: boolean) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useChatSubscription({ userId, enabled, setMessages });

    const sendMessage = async (toUser: string, content: string, options?: { replyTo?: string, attachments?: any[] }) => {
        if (!enabled || !userId) return;

        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const msg: ChatMessage = {
            id: tempId,
            tempId,
            from: userId,
            to: toUser,
            content,
            timestamp: new Date().toISOString(),
            replyTo: options?.replyTo ? { id: options.replyTo } : undefined,
            attachments: options?.attachments
        };

        setMessages((prev) => [...prev, msg]);

        try {
            const data = await chatService.sendMessage(userId, toUser, content, options);
            if (data) {
                setMessages((prev) => {
                    const normalized = prev.map((message) => message.id === tempId ? {
                        ...message,
                        id: data.id,
                        tempId,
                        timestamp: data.created_at,
                        replyTo: data.reply_to_id ? { id: data.reply_to_id } : undefined,
                        reactions: data.reactions || {},
                        attachments: data.attachments || [],
                        isPinned: data.is_pinned,
                        type: data.type
                    } : message);

                    return normalized.filter((message, index, arr) =>
                        arr.findIndex((candidate) => candidate.id === message.id) === index
                    );
                });
            }
        } catch (error) {
            safeLog.error('Error sending message:', error);
            setMessages((prev) => prev.filter((message) => message.id !== tempId));
        }
    };

    const reactToMessage = async (msgId: string, emoji: string) => {
        if (!enabled || !userId) return;

        setMessages((prev) => prev.map((message) => {
            if (message.id === msgId) {
                return { ...message, reactions: { ...message.reactions, [userId]: emoji } };
            }

            return message;
        }));

        try {
            await chatService.reactToMessage(msgId, userId, emoji);
        } catch (error) {
            safeLog.error('Error reacting to message:', error);
        }
    };

    const pinMessage = async (msgId: string, isPinned: boolean) => {
        if (!enabled) return;

        setMessages((prev) => prev.map((message) => message.id === msgId ? { ...message, isPinned } : message));
        try {
            await chatService.pinMessage(msgId, isPinned);
        } catch (error) {
            safeLog.error('Error pinning message:', error);
        }
    };

    const uploadFile = async (file: File) => {
        if (!enabled || !userId) return null;

        try {
            return await chatService.uploadFile(userId, file);
        } catch (error) {
            safeLog.error('Error uploading file:', error);
            return null;
        }
    };

    return { messages, sendMessage, reactToMessage, pinMessage, uploadFile };
}
