import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/hooks/auth/useHeaderAuth';

interface MobileUserHeaderProps {
    user: UserProfile | null;
    avatarUrl: string | null;
}

export const MobileUserHeader: React.FC<MobileUserHeaderProps> = ({ user, avatarUrl }) => {
    return (
        <div className="flex items-center gap-2.5">
            <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">{user?.full_name || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
        </div>
    );
};
