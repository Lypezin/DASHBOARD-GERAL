import { useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage } from './types';
import { chatService } from './services/chatService';

interface UseChatSubscriptionProps {
    userId: string | null;
    enabled: boolean;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

function normalizeMessage(record: any): ChatMessage {
    return {
        id: record.id,
        from: record.from_user,
        to: record.to_user,
        content: record.content,
        timestamp: record.created_at,
        replyTo: record.reply_to_id ? { id: record.reply_to_id } : undefined,
        reactions: record.reactions || {},
        attachments: record.attachments || [],
        isPinned: record.is_pinned,
        type: record.type
    };
}

function isOptimisticMatch(existing: ChatMessage, incoming: ChatMessage) {
    if (!existing.tempId) return false;
    if (existing.from !== incoming.from || existing.to !== incoming.to) return false;
    if ((existing.content || '') !== (incoming.content || '')) return false;
    if ((existing.replyTo?.id || null) !== (incoming.replyTo?.id || null)) return false;

    const existingTime = new Date(existing.timestamp).getTime();
    const incomingTime = new Date(incoming.timestamp).getTime();

    if (Number.isNaN(existingTime) || Number.isNaN(incomingTime)) return false;

    return Math.abs(incomingTime - existingTime) < 30000;
}

function sortMessages(messages: ChatMessage[]) {
    return [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function useChatSubscription({ userId, enabled, setMessages }: UseChatSubscriptionProps) {
    const chatSubscriptionRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!enabled || !userId) {
            if (chatSubscriptionRef.current) {
                supabase.removeChannel(chatSubscriptionRef.current);
                chatSubscriptionRef.current = null;
            }
            setMessages([]);
            return;
        }

        let cancelled = false;

        const loadHistory = async () => {
            try {
                const history = await chatService.fetchHistory(userId);
                if (cancelled) return;

                setMessages((prev) => sortMessages(
                    [...history, ...prev].filter((message, index, arr) =>
                        arr.findIndex((candidate) => candidate.id === message.id) === index
                    )
                ));
            } catch (error) {
                safeLog.error('Error fetching chat history:', error);
            }
        };

        void loadHistory();

        const handleChanges = (payload: any) => {
            if (cancelled) return;

            if (payload.eventType === 'INSERT') {
                const incoming = normalizeMessage(payload.new);

                setMessages((prev) => {
                    const existingIndex = prev.findIndex((message) => message.id === incoming.id);
                    if (existingIndex >= 0) {
                        const next = [...prev];
                        next[existingIndex] = { ...next[existingIndex], ...incoming };
                        return sortMessages(next);
                    }

                    const optimisticIndex = prev.findIndex((message) => isOptimisticMatch(message, incoming));
                    if (optimisticIndex >= 0) {
                        const next = [...prev];
                        next[optimisticIndex] = {
                            ...incoming,
                            tempId: next[optimisticIndex].tempId
                        };
                        return sortMessages(next);
                    }

                    return sortMessages([...prev, incoming]);
                });
            } else if (payload.eventType === 'UPDATE') {
                setMessages((prev) => prev.map((message) => message.id === payload.new.id ? {
                    ...message,
                    reactions: payload.new.reactions || {},
                    isPinned: payload.new.is_pinned
                } : message));
            }
        };

        const subscription = supabase.channel(`chat_db_changes:${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `to_user=eq.${userId}` }, handleChanges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `from_user=eq.${userId}` }, handleChanges)
            .subscribe();

        chatSubscriptionRef.current = subscription;

        return () => {
            cancelled = true;
            if (chatSubscriptionRef.current) {
                supabase.removeChannel(chatSubscriptionRef.current);
                chatSubscriptionRef.current = null;
            }
        };
    }, [enabled, setMessages, userId]);
}
