
/**
 * Componente de menu desktop do Header
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useHeaderAuth, UserProfile } from '@/hooks/auth/useHeaderAuth';
import { DesktopNavLinks } from './Header/DesktopNavLinks';
import { UserDropdown } from './Header/UserDropdown';
import { Trophy } from 'lucide-react';
import { AchievementsDialog } from './achievements/AchievementsDialog';
import { useState } from 'react';

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
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <nav className="hidden md:flex items-center gap-1">
      <DesktopNavLinks user={user} />

      <div className="mx-2 h-4 w-px bg-border/50" />

      {/* Conquistas (Only if logged in) */}
      {user && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAchievements(true)}
          className="h-9 w-9 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20"
          title="Minhas Conquistas"
        >
          <Trophy className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      )}

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

      <AchievementsDialog open={showAchievements} onOpenChange={setShowAchievements} />
    </nav>
  );
});

HeaderDesktopMenu.displayName = 'HeaderDesktopMenu';
