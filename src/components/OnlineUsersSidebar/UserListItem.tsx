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
        'group w-full rounded-lg border border-border bg-card/65 p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]',
        !isOpen && 'flex justify-center px-0 py-3'
      )}
    >
      <div className={cn('flex items-start gap-3', !isOpen && 'justify-center')}>
        <div className="relative shrink-0 select-none">
          <Avatar className="h-12 w-12 border border-border/80 shadow-sm bg-muted">
            <AvatarImage src={user.avatar_url || undefined} alt={user.name || 'Usuário'} className="object-cover" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <UserIcon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>

          <span
            className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card z-10',
              user.is_idle ? 'bg-amber-400' : 'bg-emerald-500'
            )}
            title={user.is_idle ? 'Ausente (Inativo)' : 'Online'}
          />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white font-bold ring-2 ring-card animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex flex-col">
                <p className="truncate text-sm font-black tracking-tight text-foreground font-outfit" title={user.name || ''}>
                  {user.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-semibold">
                  {user.device === 'mobile' ? (
                    <span title="Mobile"><Smartphone size={11} className="text-muted-foreground/50" /></span>
                  ) : (
                    <span title="Desktop"><Monitor size={11} className="text-muted-foreground/50" /></span>
                  )}
                  <span className="truncate rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {user.role || 'membro'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              {user.custom_status ? (
                <span className="flex items-center gap-1.5 truncate text-[11px] font-medium italic text-muted-foreground/80">
                  <Coffee size={10} className="text-muted-foreground/55 shrink-0" /> 
                  {user.custom_status}
                </span>
              ) : (
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', user.is_idle ? 'text-amber-500' : 'text-emerald-500')}>
                  {user.is_idle ? 'Ausente' : 'Disponível'}
                </span>
              )}
            </div>

            {user.current_tab && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-primary select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                <span className="truncate">
                  {user.current_tab.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
                </span>
              </div>
            )}

            <div className="mt-1.5 ml-0.5 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 select-none font-mono">
              <Clock size={10} />
              <span>{formatTimeOnline(user.online_at)}</span>
            </div>

            {/* Ações Grid */}
            <div className="mt-4.5 grid grid-cols-2 gap-2">
              <Link
                href={profileHref}
                prefetch={false}
                className="inline-flex items-center justify-center gap-1.5 h-[32px] rounded-lg border border-border bg-muted/20 text-[11px] font-bold text-foreground transition-all hover:bg-muted/40 shadow-sm"
                title={isCurrentUser ? 'Abrir meu perfil' : 'Abrir perfil'}
              >
                <ExternalLink size={12} className="text-muted-foreground/60" />
                {isCurrentUser ? 'Perfil' : 'Perfil'}
              </Link>

              {isCurrentUser ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-1.5 h-[32px] rounded-lg border border-border/40 bg-muted/10 text-[11px] font-bold text-muted-foreground/40 cursor-not-allowed"
                  title="Você não pode conversar consigo mesmo"
                >
                  <MessageSquare size={12} />
                  Chat
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChatClick(user)}
                  className="inline-flex items-center justify-center gap-1.5 h-[32px] rounded-lg bg-primary text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  title="Conversar"
                >
                  <MessageSquare size={12} />
                  Chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default UserListItem;
