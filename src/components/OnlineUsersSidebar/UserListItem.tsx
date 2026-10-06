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
  formatTimeOnline,
}: UserListItemProps) {
  const isCurrentUser = user.id === currentUser.id;
  const profileHref = buildProfileHref(user, currentUser.id);
  const DeviceIcon = user.device === 'mobile' ? Smartphone : Monitor;
  const activityLabel = user.current_tab
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

  return (
    <div
      className={cn(
        'group flex min-w-0 items-center gap-3 rounded-xl border border-transparent px-2.5 py-3 transition-colors duration-150',
        'hover:border-slate-200 hover:bg-white hover:shadow-sm dark:hover:border-slate-800 dark:hover:bg-slate-900/75',
        !isOpen && 'justify-center px-0'
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
          <AvatarImage src={user.avatar_url || undefined} alt={`Avatar de ${user.name || 'usuário'}`} className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
            <UserIcon className="h-5 w-5" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-950',
            user.is_idle ? 'bg-amber-400' : 'bg-emerald-500'
          )}
          title={user.is_idle ? 'Ausente' : 'Online'}
        />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </div>

      {isOpen ? (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100" title={user.name || ''}>
                {user.name}
              </p>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <DeviceIcon size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{user.role || 'Membro'}</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <Clock size={10} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="shrink-0 tabular-nums" title={`Conectado há ${formatTimeOnline(user.online_at)}`}>
                {formatTimeOnline(user.online_at)}
              </span>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px]">
              {user.custom_status ? (
                <><Coffee size={10} className="shrink-0 text-slate-400" aria-hidden="true" /><span className="truncate text-slate-500 dark:text-slate-400">{user.custom_status}</span></>
              ) : (
                <span className={cn('font-medium', user.is_idle ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400')}>
                  {user.is_idle ? 'Ausente' : 'Disponível'}
                </span>
              )}
              {activityLabel ? (
                <span className="truncate text-slate-400 dark:text-slate-500" title={`Acessando ${activityLabel}`}>
                  · {activityLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isCurrentUser ? (
              <button
                type="button"
                disabled
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:text-slate-500"
                title="Você não pode conversar consigo mesmo"
                aria-label="Você não pode conversar consigo mesmo"
              >
                <MessageSquare size={13} aria-hidden="true" />
                <span className="hidden xl:inline">Chat</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onChatClick(user)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-[10px] font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                title={`Conversar com ${user.name || 'esta pessoa'}`}
                aria-label={`Conversar com ${user.name || 'esta pessoa'}`}
              >
                <MessageSquare size={13} aria-hidden="true" />
                <span className="hidden xl:inline">Chat</span>
              </button>
            )}
            <Link
              href={profileHref}
              prefetch={false}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              title={`Abrir perfil de ${user.name || 'pessoa'}`}
              aria-label={`Abrir perfil de ${user.name || 'pessoa'}`}
            >
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default UserListItem;
