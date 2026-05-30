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
    <div className="subtle-scrollbar flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3 dark:bg-slate-950/70">
      {messages.length === 0 ? (
        <div className="flex h-full select-none flex-col items-center justify-center gap-2.5 text-slate-400">
          <div className="rounded-full border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <Smile size={24} className="text-slate-400" />
          </div>
          <p className="font-outfit text-[10px] font-bold uppercase tracking-wider">
            Inicie a conversa
          </p>
        </div>
      ) : null}

      {hasPinnedMessages ? (
        <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] text-amber-600 shadow-sm backdrop-blur-sm select-none dark:text-amber-400">
          <Pin size={10} className="fill-current text-amber-500" />
          <span className="flex-1 truncate font-outfit font-bold uppercase tracking-wider">
            Mensagens fixadas
          </span>
        </div>
      ) : null}

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
