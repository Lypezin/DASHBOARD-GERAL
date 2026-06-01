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
import { Settings, LogOut, Upload } from 'lucide-react';
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
          className="relative ml-1 h-9 w-9 rounded-full group focus:outline-none"
        >
          <Avatar className="h-9 w-9 border border-border transition-transform duration-200 group-hover:scale-105">
            <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-200/80 p-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.42)] dark:border-slate-800/80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex min-w-0 flex-col space-y-1">
            <p className="truncate text-sm font-semibold leading-none text-slate-900 dark:text-slate-100" title={user?.full_name || 'Usuário'}>
              {user?.full_name || 'Usuário'}
            </p>
            <p className="truncate text-xs leading-none text-muted-foreground" title={user?.email || ''}>
              {user?.email || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/upload" className="w-full cursor-pointer rounded-xl transition-colors duration-155">
            <Upload className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">Upload de Dados</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/perfil" className="w-full cursor-pointer rounded-xl">
            <Settings className="mr-2 h-4 w-4" />
            <span className="font-medium">Meu perfil</span>
          </Link>
        </DropdownMenuItem>

        {user?.is_admin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="w-full cursor-pointer rounded-xl">
              <Settings className="mr-2 h-4 w-4" />
              <span className="font-medium">Administração</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer rounded-xl text-destructive focus:text-destructive font-medium"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair da conta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
