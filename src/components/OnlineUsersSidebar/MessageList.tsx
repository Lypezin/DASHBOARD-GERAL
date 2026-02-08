import { ChatMessage, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { Smile, Pin } from 'lucide-react';
import { MessageItem } from './MessageItem';

interface MessageListProps {
    messages: ChatMessage[];
    currentUser: CurrentUser;
    onReact: (id: string, emoji: string) => void;
    onPin: (id: string, pinned: boolean) => void;
    onReply: (msg: ChatMessage | null) => void;
    onlineUsers: OnlineUser[];
    chatEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, currentUser, onReact, onPin, onReply, onlineUsers, chatEndRef }: MessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <div className="p-3 bg-slate-100 rounded-full">
                        <Smile size={24} className="text-slate-300" />
                    </div>
                    <p className="text-xs">Inicie a conversa!</p>
                </div>
            )}

            {messages.some(m => m.isPinned) && (
                <div className="bg-yellow-50 px-3 py-1 border-b border-yellow-100 flex items-center gap-2 text-[10px] text-yellow-700 sticky top-0 z-10 mb-2 rounded shadow-sm">
                    <Pin size={10} className="fill-yellow-600 text-yellow-600" />
                    <span className="truncate flex-1 font-medium">Mensagens fixadas</span>
                </div>
            )}

            {messages.map((msg, i) => {
                const isMe = msg.from === currentUser.id;
                const replyTarget = messages.find(m => m.id === msg.replyTo?.id);
                const replyTargetName = replyTarget?.from === currentUser.id ? "Você" :
                    (replyTarget ? (onlineUsers.find(u => u.id === replyTarget.from)?.name?.split(' ')[0] || "Alguém") : undefined);

                return (
                    <MessageItem
                        key={i}
                        msg={msg}
                        currentUser={currentUser}
                        isMe={isMe}
                        onReact={onReact}
                        onPin={onPin}
                        onReply={onReply}
                        replyTarget={replyTarget}
                        replyTargetName={replyTargetName}
                    />
                );
            })}
            <div ref={chatEndRef} />
        </div>
    );
}
