/**
 * Componente de menu mobile do Header
 */

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Menu, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { UserProfile } from '@/hooks/useHeaderAuth';

interface HeaderMobileMenuProps {
  user: UserProfile | null;
  avatarUrl: string | null;
  onLogout: () => void;
}

export const HeaderMobileMenu = React.memo(function HeaderMobileMenu({
  user,
  avatarUrl,
  onLogout,
}: HeaderMobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2.5">
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
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          <Button
            variant={pathname === '/' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => router.push('/')}
          >
            Dashboard
          </Button>

          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tema</span>
            </div>
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
                className="w-full justify-start"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/upload';
                }}
              >
                Upload
              </Button>
              <Button
                variant={pathname === '/admin' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/admin';
                }}
              >
                Admin
              </Button>
            </>
          )}

          <Separator className="my-4" />

          <Button
            asChild
            variant={pathname === '/perfil' ? 'default' : 'ghost'}
            className="w-full justify-start"
          >
            <Link href="/perfil" prefetch={true}>
              <Settings className="mr-2 h-4 w-4" />
              Meu Perfil
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da Conta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

HeaderMobileMenu.displayName = 'HeaderMobileMenu';

