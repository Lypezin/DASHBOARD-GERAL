import React from 'react';
import { User } from '@/hooks/useAdminData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface AdminUserCellProps {
    user: User;
}

export const AdminUserCell: React.FC<AdminUserCellProps> = ({ user }) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-medium">{user.full_name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <div className="mt-1 flex gap-1">
                    {user.is_admin && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 gap-1">
                            <Shield className="h-3 w-3" /> Admin
                        </Badge>
                    )}
                    {user.role === 'marketing' && !user.is_admin && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                            Marketing
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};
