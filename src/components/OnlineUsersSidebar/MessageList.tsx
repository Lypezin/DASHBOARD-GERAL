import React, { memo, useMemo } from 'react';
import { ChatMessage, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { Smile, Pin } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { CurrentUser } from '@/types';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: CurrentUser;
  onReact: (id: string, emoji: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onReply: (msg: ChatMessage | null) => void;
  onlineUsers: OnlineUser[];
  chatEndRef: React.RefObject<HTMLDivElement>;
}

function MessageListComponent({ messages, currentUser, onReact, onPin, onReply, onlineUsers, chatEndRef }: MessageListProps) {
  const hasPinnedMessages = useMemo(
    () => messages.some((message) => message.isPinned),
    [messages]
  );

  const messageById = useMemo(() => {
    const next = new Map<string, ChatMessage>();
    for (const message of messages) {
      next.set(message.id, message);
    }
    return next;
  }, [messages]);

  const firstNameByUserId = useMemo(() => {
    const next = new Map<string, string>();
    for (const user of onlineUsers) {
      if (user.id && user.name) {
        next.set(user.id, user.name.split(' ')[0] || 'Alguém');
      }
    }
    return next;
  }, [onlineUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/15 subtle-scrollbar">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 gap-2.5 select-none">
          <div className="p-3 bg-muted/40 border border-border/40 rounded-full shadow-sm">
            <Smile size={24} className="text-muted-foreground/50" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider font-outfit">
            Inicie a conversa!
          </p>
        </div>
      )}

      {hasPinnedMessages && (
        <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 sticky top-0 z-10 mb-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none backdrop-blur-sm">
          <Pin size={10} className="fill-current text-amber-500" />
          <span className="truncate flex-1 font-bold uppercase tracking-wider font-outfit">
            Mensagens fixadas
          </span>
        </div>
      )}

      {messages.map((message) => {
        const isMe = message.from === currentUser.id;
        const replyTarget = message.replyTo?.id ? messageById.get(message.replyTo.id) : undefined;
        const replyTargetName = replyTarget
          ? (replyTarget.from === currentUser.id ? 'Você' : firstNameByUserId.get(replyTarget.from) || 'Alguém')
          : undefined;

        return (
          <MessageItem
            key={message.id}
            msg={message}
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

export const MessageList = memo(MessageListComponent);
export default MessageList;
