import Link from 'next/link';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock3, ExternalLink, MessageSquare, User2, ChevronRight } from 'lucide-react';
import { buildProfileHref } from './profileHref';

interface UserProfilePreviewProps {
    user: OnlineUser | null;
    currentUserId: string;
    unreadCount?: number;
    onStartChat: (user: OnlineUser) => void;
    formatTimeOnline: (d: string) => string;
}

export function UserProfilePreview({
    user,
    currentUserId,
    unreadCount = 0,
    onStartChat,
    formatTimeOnline
}: UserProfilePreviewProps) {
    if (!user) {
        return (
            <div className="px-3 pt-3">
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    Selecione alguem da lista para ver um perfil rapido.
                </div>
            </div>
        );
    }

    const isCurrentUser = user.id === currentUserId;
    const profileHref = buildProfileHref(user, currentUserId);

    return (
        <div className="px-3 pt-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <Link href={profileHref} className="block rounded-xl transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/80">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-800">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.name || 'Usuario'} />
                            <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name || 'Usuario'}</p>
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${user.is_idle ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className="capitalize">{user.role || 'usuario'}</Badge>
                                {unreadCount > 0 && (
                                    <Badge className="bg-red-500 hover:bg-red-500">{unreadCount > 9 ? '9+' : unreadCount} nao lida(s)</Badge>
                                )}
                            </div>
                        </div>

                        <ExternalLink size={14} className="mt-1 shrink-0 text-slate-400" />
                    </div>
                </Link>

                <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
                    {user.custom_status && (
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                            <span className="font-medium text-slate-800 dark:text-slate-100">Status:</span> {user.custom_status}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Clock3 size={13} className="text-slate-400" />
                        <span>Conectado ha {formatTimeOnline(user.online_at)}</span>
                    </div>

                    {user.current_tab && (
                        <div className="flex items-center gap-2">
                            <Activity size={13} className="text-blue-500" />
                            <span className="truncate">
                                Agora em <strong>{user.current_tab.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}</strong>
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    {!isCurrentUser ? (
                        <Button className="gap-2" onClick={() => onStartChat(user)}>
                            <MessageSquare size={14} />
                            Conversar
                        </Button>
                    ) : (
                        <Button asChild className="gap-2">
                            <Link href="/perfil">
                                <User2 size={14} />
                                Meu perfil
                            </Link>
                        </Button>
                    )}

                    <Button asChild variant="outline" className="gap-2">
                        <Link href={profileHref}>
                            {isCurrentUser ? <ChevronRight size={14} /> : <ExternalLink size={14} />}
                            {isCurrentUser ? 'Abrir perfil' : 'Ver perfil'}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
