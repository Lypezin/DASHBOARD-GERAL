import { OnlineUser } from '@/hooks/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, Smartphone, Monitor, Coffee, Clock } from 'lucide-react';

interface UserListItemProps {
    user: OnlineUser;
    currentUser: CurrentUser;
    unreadCount: number;
    isOpen: boolean;
    onChatClick: (user: OnlineUser) => void;
    formatTimeOnline: (d: string) => string;
}

export function UserListItem({ user, currentUser, unreadCount, isOpen, onChatClick, formatTimeOnline }: UserListItemProps) {
    return (
        <div className={cn(
            "group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100",
            !isOpen && "justify-center px-0 py-3"
        )}>
            {/* Avatar & Status */}
            <div className="relative shrink-0">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name || 'User'} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <UserIcon className="w-5 h-5 text-slate-400" />
                    </div>
                )}

                <span className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                    user.is_idle ? "bg-amber-400" : "bg-emerald-500")}
                    title={user.is_idle ? "Ausente (Inativo)" : "Online"}
                />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>

            {/* Info Area */}
            {isOpen && (
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-slate-700 truncate" title={user.name || ''}>{user.name}</p>
                        <div className="flex items-center gap-1">
                            {user.id !== currentUser.id && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onChatClick(user); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors text-xs font-medium"
                                    title="Enviar mensagem"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                    Chat
                                </button>
                            )}

                            <div className="text-slate-300">
                                {user.device === 'mobile' ? (
                                    <span title="Mobile"><Smartphone size={14} className="text-slate-400" /></span>
                                ) : (
                                    <span title="Desktop"><Monitor size={14} className="text-slate-400" /></span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        {user.custom_status ? (
                            <span className="text-xs text-slate-500 italic truncate flex items-center gap-1">
                                <Coffee size={10} /> {user.custom_status}
                            </span>
                        ) : (
                            <span className={cn("text-xs truncate", user.is_idle ? "text-amber-500" : "text-emerald-600")}>
                                {user.is_idle ? 'Ausente' : 'Disponível'}
                            </span>
                        )}
                    </div>

                    {user.current_tab && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="truncate">
                                {user.current_tab.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 ml-0.5">
                        <Clock size={10} />
                        <span>{formatTimeOnline(user.online_at)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
