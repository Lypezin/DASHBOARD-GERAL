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
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white', activeChatUser.is_idle ? 'bg-amber-400' : 'bg-emerald-500')} />
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={activeChatUser.avatar_url || undefined} alt={`Avatar de ${activeChatUser.name || 'usuario'}`} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-500">
                            <User className="w-8 h-8 p-1.5" />
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="leading-tight">
                    <span className="text-sm font-bold text-slate-800 block">{activeChatUser.name?.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-500 block">
                        {isTyping
                            ? <span className="text-blue-500 animate-pulse font-medium">digitando...</span>
                            : (activeChatUser.is_idle ? 'Ausente' : 'Online')}
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}

export const ChatHeader = memo(ChatHeaderComponent);
