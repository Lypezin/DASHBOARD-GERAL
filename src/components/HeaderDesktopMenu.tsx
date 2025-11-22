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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
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
    <nav className="hidden md:flex items-center gap-2 flex-shrink-0 min-w-0">
      <Button
        variant={pathname === '/' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => router.push('/')}
      >
        Dashboard
      </Button>

      {/* Toggle de Tema com Switch */}
      <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>

      {user?.is_admin && (
        <>
          <Button
            variant={pathname === '/upload' ? 'default' : 'ghost'}
            size="sm"
            className="hidden xl:inline-flex"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/upload';
            }}
          >
            Upload
          </Button>
          <Button
            variant={pathname === '/upload' ? 'default' : 'ghost'}
            size="sm"
            className="xl:hidden"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/upload';
            }}
          >
            📤
          </Button>
          <Button
            variant={pathname === '/admin' ? 'default' : 'ghost'}
            size="sm"
            className="hidden xl:inline-flex"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/admin';
            }}
          >
            Admin
          </Button>
          <Button
            variant={pathname === '/admin' ? 'default' : 'ghost'}
            size="sm"
            className="xl:hidden"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/admin';
            }}
          >
            ⚙️
          </Button>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 px-2.5 h-9"
          >
            <Avatar className="h-7 w-7 border-2 border-slate-200 dark:border-slate-700">
              <AvatarImage src={avatarUrl || user?.avatar_url || undefined} alt={user?.full_name || 'Usuário'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden xl:inline text-sm font-medium">
              {user?.full_name?.split(' ')[0] || 'Conta'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="p-3">
            <div className="flex items-center gap-2.5 mb-2">
              <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
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
            {user?.is_admin && (
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                Administrador
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/perfil" className="flex items-center gap-2.5 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2.5" />
            <span>Sair da Conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
});

HeaderDesktopMenu.displayName = 'HeaderDesktopMenu';

