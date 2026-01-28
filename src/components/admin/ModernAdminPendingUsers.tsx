import React from 'react';
import { User } from '@/hooks/auth/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock } from 'lucide-react';

interface AdminPendingUsersProps {
    pendingUsers: User[];
    onApprove: (user: User) => void;
}

export const ModernAdminPendingUsers: React.FC<AdminPendingUsersProps> = ({
    pendingUsers,
    onApprove,
}) => {
    if (pendingUsers.length === 0) {
        return null;
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                    <Clock className="h-5 w-5" />
                    Aprovações Pendentes ({pendingUsers.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingUsers.map((user) => (
                    <Card key={user.id} className="bg-white dark:bg-slate-950">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => onApprove(user)}
                                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                            >
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Aprovar Acesso
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
};
