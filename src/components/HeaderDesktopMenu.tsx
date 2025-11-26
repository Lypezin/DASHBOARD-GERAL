/**
 * Componente de menu desktop do Header
 */

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
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
import { Settings, LogOut, Moon, Sun } from 'lucide-react';
import { UserProfile } from '@/hooks/useHeaderAuth';

interface HeaderDesktopMenuProps {
  user: UserProfile | null;
  avatarUrl: string | null;
  onLogout: () => void;
}

export const HeaderDesktopMenu = React.memo(function HeaderDesktopMenu({
  user,
  avatarUrl,
  onLogout,
}: HeaderDesktopMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="hidden md:flex items-center gap-1">
      <Button
        variant={pathname === '/' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => router.push('/')}
        className="text-sm font-medium"
      >
        Dashboard
      </Button>

      {user?.is_admin && (
        <>
          <Button
            variant={pathname === '/upload' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/upload';
            }}
            className="text-sm font-medium"
          >
            Upload
          </Button>
          <Button
            variant={pathname === '/admin' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/admin';
            }}
            className="text-sm font-medium"
          >
            Admin
          </Button>
        </>
      )}

      <div className="mx-2 h-4 w-px bg-border/50" />

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-9 w-9"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Alternar tema</span>
      </Button>

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
    </nav>
  );
});

HeaderDesktopMenu.displayName = 'HeaderDesktopMenu';

