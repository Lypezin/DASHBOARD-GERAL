import { memo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChatMessage, OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  currentUser: CurrentUser;
  activeChatUser: OnlineUser | null;
  setActiveChatUser: (u: OnlineUser | null) => void;
  messages: ChatMessage[];
  onReact: (id: string, emoji: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onReply: (msg: ChatMessage | null) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSendMessage: () => void;
  replyingTo: ChatMessage | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onlineUsers: OnlineUser[];
  setTypingTo: (id: string | null) => void;
}

function ChatWindowComponent({
  currentUser, activeChatUser, setActiveChatUser, messages,
  onReact, onPin, onReply, chatEndRef,
  chatInput, setChatInput, handleSendMessage, replyingTo,
  fileInputRef, onlineUsers, setTypingTo
}: ChatWindowProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <AnimatePresence initial={false}>
      {activeChatUser ? (
        <motion.section
          key={activeChatUser.id}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
          transition={{ duration: shouldReduceMotion ? 0.08 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          aria-label={`Conversa com ${activeChatUser.name || 'pessoa da equipe'}`}
          className="absolute inset-0 z-[62] flex min-h-0 flex-col overflow-hidden border border-slate-200 bg-white font-sans shadow-[-12px_0_38px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-950 lg:inset-y-0 lg:left-[calc(-22rem-0.75rem)] lg:right-auto lg:h-full lg:w-[22rem] lg:rounded-2xl"
        >
          <ChatHeader 
            activeChatUser={activeChatUser} 
            currentUser={currentUser} 
            onClose={() => setActiveChatUser(null)} 
          />

          <MessageList
            messages={messages}
            currentUser={currentUser}
            onReact={onReact}
            onPin={onPin}
            onReply={onReply}
            onlineUsers={onlineUsers}
            chatEndRef={chatEndRef}
            conversationName={activeChatUser.name?.split(' ')[0] || 'esta pessoa'}
          />

          <MessageInput
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            setReplyingTo={onReply}
            fileInputRef={fileInputRef}
            setTypingTo={setTypingTo}
            activeUserId={activeChatUser.id}
          />
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

export const ChatWindow = memo(ChatWindowComponent);
export default ChatWindow;
