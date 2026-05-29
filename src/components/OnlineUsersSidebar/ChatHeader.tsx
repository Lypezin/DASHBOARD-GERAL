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
    <div className="p-3 bg-card border-b border-border flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)] z-10 select-none">
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card z-10',
            activeChatUser.is_idle ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
          )} />
          <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
            <AvatarImage src={activeChatUser.avatar_url || undefined} alt={`Avatar de ${activeChatUser.name || 'usuario'}`} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="w-8 h-8 p-1.5" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="leading-tight flex flex-col">
          <span className="text-sm font-black text-foreground block font-outfit">
            {activeChatUser.name}
          </span>
          <span className="text-[9px] text-muted-foreground/80 block font-bold uppercase tracking-wider">
            {isTyping ? (
              <span className="text-primary animate-pulse font-extrabold">digitando...</span>
            ) : (
              activeChatUser.is_idle ? 'Ausente' : 'Online'
            )}
          </span>
        </div>
      </div>
      <button 
        onClick={onClose} 
        type="button"
        className="text-muted-foreground/60 hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors focus:outline-none"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
