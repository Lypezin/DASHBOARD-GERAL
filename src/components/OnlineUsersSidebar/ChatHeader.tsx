import { OnlineUser } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';
import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
    activeChatUser: OnlineUser;
    currentUser: CurrentUser;
    onClose: () => void;
}

export function ChatHeader({ activeChatUser, currentUser, onClose }: ChatHeaderProps) {
    return (
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <span className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white", activeChatUser.is_idle ? "bg-amber-400" : "bg-emerald-500")} />
                    {activeChatUser.avatar_url ? (
                        <img src={activeChatUser.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : <User className="w-8 h-8 p-1.5 bg-slate-100 rounded-full text-slate-500" />}
                </div>
                <div className="leading-tight">
                    <span className="text-sm font-bold text-slate-800 block">{activeChatUser.name?.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-500 block">
                        {activeChatUser.typing_to === currentUser.id
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
