import React, { memo, useMemo } from 'react';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatHeaderProps {
  activeChatUser: OnlineUser;
  currentUser: CurrentUser;
  onClose: () => void;
}

function ChatHeaderComponent({ activeChatUser, currentUser, onClose }: ChatHeaderProps) {
  const isTyping = useMemo(() => {
    const lastTypedAt = activeChatUser.last_typed ? new Date(activeChatUser.last_typed).getTime() : NaN;
    return activeChatUser.typing_to === currentUser.id &&
      !Number.isNaN(lastTypedAt) &&
      Date.now() - lastTypedAt < 6000;
  }, [activeChatUser.last_typed, activeChatUser.typing_to, currentUser.id]);

  return (
    <div className="z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 p-3 shadow-sm select-none dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className={cn(
            'absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950',
            activeChatUser.is_idle ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
          )} />
          <Avatar className="h-9 w-9 border border-slate-200/80 shadow-sm dark:border-slate-800/80">
            <AvatarImage src={activeChatUser.avatar_url || undefined} alt={`Avatar de ${activeChatUser.name || 'usuário'}`} className="object-cover" />
            <AvatarFallback className="bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <User className="w-8 h-8 p-1.5" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="leading-tight flex flex-col">
          <span className="block max-w-[180px] truncate font-outfit text-sm font-black text-slate-950 dark:text-white" title={activeChatUser.name}>
            {activeChatUser.name}
          </span>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isTyping ? (
              <span className="animate-pulse font-extrabold text-blue-600 dark:text-blue-300">digitando...</span>
            ) : (
              activeChatUser.is_idle ? 'Ausente' : 'Online'
            )}
          </span>
        </div>
      </div>
      <button 
        onClick={onClose} 
        type="button"
        className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
