import React, { memo, useMemo } from 'react';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { User, X, ArrowLeft } from 'lucide-react';
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
    <div className="z-10 flex min-h-[4.25rem] items-center justify-between border-b border-slate-200 bg-white px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onClose}
          type="button"
          className="-ml-1 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-900 lg:hidden"
          aria-label="Voltar para a equipe"
        >
          <ArrowLeft size={17} aria-hidden="true" />
        </button>
        <div className="relative shrink-0">
          <span className={cn(
            'absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950',
            activeChatUser.is_idle ? 'bg-amber-400' : 'bg-emerald-500'
          )} />
          <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
            <AvatarImage src={activeChatUser.avatar_url || undefined} alt={`Avatar de ${activeChatUser.name || 'usuário'}`} className="object-cover" />
            <AvatarFallback className="bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <User className="h-5 w-5" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 leading-tight">
          <span className="block max-w-[220px] truncate text-sm font-semibold text-slate-950 dark:text-white" title={activeChatUser.name || undefined}>
            {activeChatUser.name}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {isTyping ? (
              <>
                <span className="flex gap-0.5" aria-hidden="true">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500 [animation-delay:-0.2s]" />
                  <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500 [animation-delay:-0.1s]" />
                  <span className="h-1 w-1 animate-pulse rounded-full bg-blue-500" />
                </span>
                <span className="text-blue-700 dark:text-blue-300">digitando</span>
              </>
            ) : (
              <>
                <span className={cn('h-1.5 w-1.5 rounded-full', activeChatUser.is_idle ? 'bg-amber-400' : 'bg-emerald-500')} aria-hidden="true" />
                {activeChatUser.is_idle ? 'Ausente' : 'Online'}
              </>
            )}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        type="button"
        className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white lg:block"
        aria-label="Fechar conversa"
      >
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
