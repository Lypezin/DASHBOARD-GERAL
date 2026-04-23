import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, Smartphone, Monitor, Coffee, Clock, MessageSquare } from 'lucide-react';

interface UserListItemProps {
    user: OnlineUser;
    currentUser: CurrentUser;
    unreadCount: number;
    isOpen: boolean;
    isSelected?: boolean;
    onSelect: (user: OnlineUser) => void;
    onChatClick: (user: OnlineUser) => void;
    formatTimeOnline: (d: string) => string;
}

export function UserListItem({
    user,
    currentUser,
    unreadCount,
    isOpen,
    isSelected,
    onSelect,
    onChatClick,
    formatTimeOnline
}: UserListItemProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(user)}
            className={cn(
                'group w-full rounded-xl border p-2 text-left transition-all',
                isSelected
                    ? 'border-blue-200 bg-blue-50/70 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10'
                    : 'border-transparent hover:border-slate-100 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900/70',
                !isOpen && 'flex justify-center px-0 py-3'
            )}
        >
            <div className={cn('flex items-center gap-3', !isOpen && 'justify-center')}>
                <div className="relative shrink-0">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name || 'Usuario'} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                            <UserIcon className="w-5 h-5 text-slate-400" />
                        </div>
                    )}

                    <span
                        className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', user.is_idle ? 'bg-amber-400' : 'bg-emerald-500')}
                        title={user.is_idle ? 'Ausente (Inativo)' : 'Online'}
                    />

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>

                {isOpen && (
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-100" title={user.name || ''}>{user.name}</p>
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                    {user.device === 'mobile' ? (
                                        <span title="Mobile"><Smartphone size={12} className="text-slate-400" /></span>
                                    ) : (
                                        <span title="Desktop"><Monitor size={12} className="text-slate-400" /></span>
                                    )}
                                    <span className="truncate">{user.role || 'usuario'}</span>
                                </div>
                            </div>

                            {user.id !== currentUser.id && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChatClick(user);
                                    }}
                                    className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
                                    title="Conversar"
                                >
                                    <MessageSquare size={12} />
                                    Chat
                                </button>
                            )}
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                            {user.custom_status ? (
                                <span className="flex items-center gap-1 truncate text-xs italic text-slate-500">
                                    <Coffee size={10} /> {user.custom_status}
                                </span>
                            ) : (
                                <span className={cn('text-xs truncate', user.is_idle ? 'text-amber-500' : 'text-emerald-600')}>
                                    {user.is_idle ? 'Ausente' : 'Disponivel'}
                                </span>
                            )}
                        </div>

                        {user.current_tab && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                <span className="truncate">
                                    {user.current_tab.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
                                </span>
                            </div>
                        )}

                        <div className="mt-1 ml-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={10} />
                            <span>{formatTimeOnline(user.online_at)}</span>
                        </div>
                    </div>
                )}
            </div>
        </button>
    );
}
