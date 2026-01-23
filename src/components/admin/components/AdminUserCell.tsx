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

    const getAvatarUrl = (user: User | any) => {
        // Tenta pegar do campo direto
        if (user.avatar_url) return user.avatar_url;

        // Tenta pegar do raw_user_meta_data (se existir na resposta do RPC)
        if (user.raw_user_meta_data?.avatar_url) return user.raw_user_meta_data.avatar_url;

        // Checks extras baseados no Chat (presenceData.ts)
        if (user.picture) return user.picture;
        if (user.photo_url) return user.photo_url;

        const metadata = user.raw_user_meta_data || user.user_metadata;
        if (metadata) {
            if (metadata.avatar_url) return metadata.avatar_url;
            if (metadata.picture) return metadata.picture;
        }

        return undefined;
    };

    const avatarUrl = getAvatarUrl(user);

    return (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={avatarUrl} />
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
