import React, { memo, useMemo } from 'react';
import { ChatMessage, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { MessageCircle, Pin } from 'lucide-react';
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
  conversationName: string;
}

function MessageListComponent({ messages, currentUser, onReact, onPin, onReply, onlineUsers, chatEndRef, conversationName }: MessageListProps) {
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
    <div role="log" aria-label="Mensagens da conversa" aria-relevant="additions" className="subtle-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/80 px-3.5 py-4 dark:bg-slate-900/35 sm:px-4">
      {messages.length === 0 ? (
        <div className="flex flex-1 select-none flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-blue-300">
            <MessageCircle size={21} aria-hidden="true" />
          </div>
          <p className="max-w-[15rem] text-sm font-semibold text-slate-800 dark:text-slate-100">
            Converse com {conversationName}
          </p>
          <p className="mt-1.5 max-w-[16rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">Envie uma mensagem para iniciar ou retomar a conversa.</p>
        </div>
      ) : null}

      {hasPinnedMessages ? (
        <div className="sticky top-0 z-10 -mb-1 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 shadow-sm select-none dark:bg-amber-400/10 dark:text-amber-300">
          <Pin size={10} className="fill-current text-amber-500" />
          <span className="flex-1 truncate font-semibold">
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
