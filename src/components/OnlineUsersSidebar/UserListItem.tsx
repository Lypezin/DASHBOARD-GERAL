import Link from 'next/link';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, Smartphone, Monitor, Coffee, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { buildProfileHref } from './profileHref';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserListItemProps {
    user: OnlineUser;
    currentUser: CurrentUser;
    unreadCount: number;
    isOpen: boolean;
    onChatClick: (user: OnlineUser) => void;
    formatTimeOnline: (d: string) => string;
}

export function UserListItem({
    user,
    currentUser,
    unreadCount,
    isOpen,
    onChatClick,
    formatTimeOnline
}: UserListItemProps) {
    const isCurrentUser = user.id === currentUser.id;
    const profileHref = buildProfileHref(user, currentUser.id);

    return (
        <div
            className={cn(
                'group w-full rounded-[1.6rem] border border-slate-200/80 bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700',
                !isOpen && 'flex justify-center px-0 py-3'
            )}
        >
            <div className={cn('flex items-start gap-3', !isOpen && 'justify-center')}>
                <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.name || 'Usuario'} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-400">
                            <UserIcon className="w-5 h-5" />
                        </AvatarFallback>
                    </Avatar>

                    <span
                        className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', user.is_idle ? 'bg-amber-400' : 'bg-emerald-500')}
                        title={user.is_idle ? 'Ausente (Inativo)' : 'Online'}
                    />

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white font-bold ring-2 ring-white animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>

                {isOpen && (
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[1.05rem] font-semibold leading-tight text-slate-900 dark:text-slate-50" title={user.name || ''}>{user.name}</p>
                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                                    {user.device === 'mobile' ? (
                                        <span title="Mobile"><Smartphone size={12} className="text-slate-400" /></span>
                                    ) : (
                                        <span title="Desktop"><Monitor size={12} className="text-slate-400" /></span>
                                    )}
                                    <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">{user.role || 'usuario'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            {user.custom_status ? (
                                <span className="flex items-center gap-1.5 truncate text-sm italic text-slate-500">
                                    <Coffee size={10} /> {user.custom_status}
                                </span>
                            ) : (
                                <span className={cn('text-sm font-medium truncate', user.is_idle ? 'text-amber-500' : 'text-emerald-600')}>
                                    {user.is_idle ? 'Ausente' : 'Disponivel'}
                                </span>
                            )}
                        </div>

                        {user.current_tab && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-blue-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                <span className="truncate">
                                    {user.current_tab.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
                                </span>
                            </div>
                        )}

                        <div className="mt-1.5 ml-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock size={10} />
                            <span>{formatTimeOnline(user.online_at)}</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                            <Link
                                href={profileHref}
                                prefetch={false}
                                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                title={isCurrentUser ? 'Abrir meu perfil' : 'Abrir perfil'}
                            >
                                <ExternalLink size={12} />
                                {isCurrentUser ? 'Meu perfil' : 'Ver perfil'}
                            </Link>

                            {isCurrentUser ? (
                                <button
                                    type="button"
                                    disabled
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-[12px] font-medium text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-500"
                                    title="Voce nao pode conversar consigo mesmo"
                                >
                                    <MessageSquare size={12} />
                                    Chat
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onChatClick(user)}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-[12px] font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700"
                                    title="Conversar"
                                >
                                    <MessageSquare size={12} />
                                    Conversar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
