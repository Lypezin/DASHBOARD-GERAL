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

export function UserList({
    isOpen,
    currentUser,
    filteredUsers,
    unreadCounts,
    onUserClick,
    formatTimeOnline
}: UserListProps) {
    const groupedUsers = {
        admin: sortUsers(filteredUsers.filter((user) => user.role === 'admin' || user.role === 'master'), unreadCounts, currentUser.id),
        marketing: sortUsers(filteredUsers.filter((user) => user.role === 'marketing'), unreadCounts, currentUser.id),
        user: sortUsers(filteredUsers.filter((user) => user.role === 'user' || !user.role || (user.role !== 'admin' && user.role !== 'master' && user.role !== 'marketing')), unreadCounts, currentUser.id)
    };

    const hasUsers = filteredUsers.length > 0;

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            {['admin', 'marketing', 'user'].map((group) => {
                const usersInGroup = groupedUsers[group as keyof typeof groupedUsers];
                if (usersInGroup.length === 0) return null;

                return (
                    <div key={group} className="space-y-2">
                        {isOpen && (
                            <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {group === 'user' ? 'Geral' : group} ({usersInGroup.length})
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
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    Ninguem encontrado no momento.
                </div>
            )}
        </div>
    );
}
