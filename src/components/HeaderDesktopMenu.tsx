
/**
 * Componente de menu desktop do Header
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { UserProfile } from '@/hooks/useHeaderAuth';
import { DesktopNavLinks } from './Header/DesktopNavLinks';
import { UserDropdown } from './Header/UserDropdown';

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
  const { theme, setTheme } = useTheme();

  return (
    <nav className="hidden md:flex items-center gap-1">
      <DesktopNavLinks user={user} />

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

      <UserDropdown user={user} avatarUrl={avatarUrl} onLogout={onLogout} />
    </nav>
  );
});

HeaderDesktopMenu.displayName = 'HeaderDesktopMenu';
