
import React from 'react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { UserProfile } from '@/hooks/auth/types';

interface UserDropdownProps {
    user: UserProfile | null;
    avatarUrl: string | null;
    onLogout: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
    user,
    avatarUrl,
    onLogout,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ml-1"
                >
                    <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name || 'Usuário'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Meu Perfil</span>
                    </Link>
                </DropdownMenuItem>
                {user?.is_admin && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer w-full">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Administração</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair da Conta</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
