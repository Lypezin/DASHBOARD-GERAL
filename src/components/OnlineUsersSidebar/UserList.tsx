import { OnlineUser } from '@/hooks/data/useOnlineUsers';
import { CurrentUser } from '@/types';
import { UserListItem } from './UserListItem';

interface UserListProps {
    isOpen: boolean;
    currentUser: CurrentUser;
    filteredUsers: OnlineUser[];
    unreadCounts: Record<string, number>;
    selectedUserId?: string | null;
    onUserClick: (user: OnlineUser) => void;
    onUserSelect: (user: OnlineUser) => void;
    formatTimeOnline: (d: string) => string;
}

export function UserList({
    isOpen,
    currentUser,
    filteredUsers,
    unreadCounts,
    selectedUserId,
    onUserClick,
    onUserSelect,
    formatTimeOnline
}: UserListProps) {
    const groupedUsers = {
        admin: filteredUsers.filter((u) => u.role === 'admin' || u.role === 'master'),
        marketing: filteredUsers.filter((u) => u.role === 'marketing'),
        user: filteredUsers.filter((u) => u.role === 'user' || !u.role || (u.role !== 'admin' && u.role !== 'master' && u.role !== 'marketing'))
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
                                isSelected={selectedUserId === user.id}
                                onSelect={onUserSelect}
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
