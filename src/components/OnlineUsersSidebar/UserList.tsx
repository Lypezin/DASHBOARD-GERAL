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

export function UserList({ isOpen, currentUser, filteredUsers, unreadCounts, onUserClick, formatTimeOnline }: UserListProps) {
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
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider">
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
                <div className="text-center p-4 text-slate-400 text-sm">
                    Ninguém encontrado... 👻
                </div>
            )}
        </div>
    );
}
