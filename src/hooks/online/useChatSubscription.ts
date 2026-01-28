
import { useEffect, useRef } from 'react';
import { safeLog } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage } from './types';
import { chatService } from './services/chatService';

interface UseChatSubscriptionProps {
    userId: string | null;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useChatSubscription({ userId, setMessages }: UseChatSubscriptionProps) {
    const chatSubscriptionRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!userId) return;

        const loadHistory = async () => {
            try {
                const history = await chatService.fetchHistory(userId);
                setMessages(history);
            } catch (error) {
                safeLog.error('Error fetching chat history:', error);
            }
        };

        loadHistory();

        const handleChanges = (payload: any) => {
            if (payload.eventType === 'INSERT') {
                const newMsg = payload.new;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) {
                        return prev.map(m => m.id === newMsg.id ? {
                            ...m,
                            timestamp: newMsg.created_at,
                            reactions: newMsg.reactions || {},
                            isPinned: newMsg.is_pinned
                        } : m);
                    }
                    return [...prev, {
                        id: newMsg.id,
                        from: newMsg.from_user,
                        to: newMsg.to_user,
                        content: newMsg.content,
                        timestamp: newMsg.created_at,
                        replyTo: newMsg.reply_to_id ? { id: newMsg.reply_to_id } : undefined,
                        reactions: newMsg.reactions || {},
                        attachments: newMsg.attachments || [],
                        isPinned: newMsg.is_pinned,
                        type: newMsg.type
                    }];
                });
            } else if (payload.eventType === 'UPDATE') {
                setMessages(prev => prev.map(m => m.id === payload.new.id ? {
                    ...m,
                    reactions: payload.new.reactions || {},
                    isPinned: payload.new.is_pinned
                } : m));
            }
        };

        const sub = supabase.channel('chat_db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `to_user=eq.${userId}` }, handleChanges)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `from_user=eq.${userId}` }, handleChanges)
            .subscribe();

        chatSubscriptionRef.current = sub;

        return () => {
            if (chatSubscriptionRef.current) supabase.removeChannel(chatSubscriptionRef.current);
        };
    }, [userId, setMessages]);
}
