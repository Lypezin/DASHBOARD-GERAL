import { memo, useMemo } from 'react';
import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { UserListItem } from './UserListItem';

interface UserListProps {
    isOpen: boolean;
    currentUser: CurrentUser;
    filteredUsers: OnlineUser[];
    unreadCounts: Record<string, number>;
    onUserClick: (user: OnlineUser) => void;
    formatTimeOnline: (d: string) => string;
}

function sortUsers(users: OnlineUser[], unreadCounts: Record<string, number>, currentUserId: string) {
    return [...users].sort((a, b) => {
        const aUnread = unreadCounts[a.id] || 0;
        const bUnread = unreadCounts[b.id] || 0;
        if (aUnread !== bUnread) return bUnread - aUnread;

        if (a.id === currentUserId && b.id !== currentUserId) return -1;
        if (b.id === currentUserId && a.id !== currentUserId) return 1;

        if (!!a.is_idle !== !!b.is_idle) return a.is_idle ? 1 : -1;

        return (a.name || '').localeCompare(b.name || '');
    });
}

function UserListComponent({
    isOpen,
    currentUser,
    filteredUsers,
    unreadCounts,
    onUserClick,
    formatTimeOnline
}: UserListProps) {
    const groupedUsers = useMemo(() => ({
        admin: sortUsers(filteredUsers.filter((user) => user.role === 'admin' || user.role === 'master'), unreadCounts, currentUser.id),
        marketing: sortUsers(filteredUsers.filter((user) => user.role === 'marketing'), unreadCounts, currentUser.id),
        user: sortUsers(
            filteredUsers.filter((user) => user.role === 'user' || !user.role || (user.role !== 'admin' && user.role !== 'master' && user.role !== 'marketing')),
            unreadCounts,
            currentUser.id
        )
    }), [currentUser.id, filteredUsers, unreadCounts]);

    const hasUsers = filteredUsers.length > 0;

    return (
        <div className="subtle-scrollbar flex-1 space-y-5 overflow-y-auto px-4 pb-5 pt-4">
            {['admin', 'marketing', 'user'].map((group) => {
                const usersInGroup = groupedUsers[group as keyof typeof groupedUsers];
                if (usersInGroup.length === 0) return null;

                return (
                    <div key={group} className="space-y-2.5">
                        {isOpen && (
                            <h4 className="flex items-center gap-2 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                <span>{group === 'user' ? 'Equipe' : group === 'admin' ? 'Administradores' : 'Marketing'}</span>
                                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                <span className="tabular-nums text-slate-400 dark:text-slate-500">{usersInGroup.length}</span>
                            </h4>
                        )}

                        {usersInGroup.map((user) => (
                            <UserListItem
                                key={user.id}
                                user={user}
                                currentUser={currentUser}
                                unreadCount={unreadCounts[user.id] || 0}
                                isOpen={isOpen}
                                onChatClick={onUserClick}
                                formatTimeOnline={formatTimeOnline}
                            />
                        ))}
                    </div>
                );
            })}

            {!hasUsers && isOpen && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                    Nenhuma pessoa encontrada. Tente outro nome ou cargo.
                </div>
            )}
        </div>
    );
}

export const UserList = memo(UserListComponent);
