'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSidebar } from '@/contexts/SidebarContext';
import { useDashboardActiveTab } from '@/hooks/dashboard/useDashboardActiveTab';
import { useHeaderAuth } from '@/hooks/auth/useHeaderAuth';
import { useHeaderAvatar } from '@/hooks/auth/useHeaderAvatar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/Header/UserDropdown';
import { Menu, Moon, Sun, Trophy, ChevronRight } from 'lucide-react';
import { TabType } from '@/types';
import { CityLastUpdatesTicker } from '@/components/dashboard/CityLastUpdatesTicker';

const DeferredAchievementsDialog = dynamic(
  () => import('@/components/achievements/AchievementsDialog').then((mod) => ({ default: mod.AchievementsDialog })),
  { ssr: false }
);

const BREADCRUMB_MAP: Record<TabType, { group: string; label: string }> = {
  dashboard: { group: 'Principal', label: 'Visão Geral' },
  analise: { group: 'Principal', label: 'Análise' },
  utr: { group: 'Principal', label: 'UTR' },
  comparacao: { group: 'Principal', label: 'Comparação' },
  entregadores: { group: 'Operacional', label: 'Entregadores' },
  valores: { group: 'Operacional', label: 'Valores' },
  prioridade: { group: 'Operacional', label: 'Prioridade | Promo' },
  evolucao: { group: 'Operacional', label: 'Evolução' },
  dedicado: { group: 'Operacional', label: 'Dedicado' },
  marketing_comparacao: { group: 'Marketing', label: 'Operacional | Marketing' },
  marketing: { group: 'Marketing', label: 'Marketing' },
};

export function DashboardHeader() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const activeTab = useDashboardActiveTab();
  const { user, handleLogout } = useHeaderAuth();
  const avatarUrl = useHeaderAvatar(user);
  const { toggleTheme } = useTheme();
  const [showAchievements, setShowAchievements] = useState(false);

  const breadcrumb = BREADCRUMB_MAP[activeTab] || { group: 'Principal', label: 'Visão Geral' };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full min-w-0 items-center justify-between border-b border-border bg-card px-3 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
            className="h-9 w-9 shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu lateral</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden h-9 w-9 shrink-0 md:flex"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu lateral</span>
          </Button>

          <div className="hidden h-4 w-px shrink-0 bg-border/80 sm:block" />

          <nav className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:text-sm">
            <span className="hidden shrink-0 font-medium text-muted-foreground/72 xs:inline sm:inline">{breadcrumb.group}</span>
            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 opacity-60 xs:block sm:block" />
            <span className="min-w-0 truncate font-bold text-foreground">{breadcrumb.label}</span>
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 pl-2 sm:gap-2">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAchievements(true)}
              className="h-9 w-9 text-yellow-600 hover:bg-yellow-100/50 hover:text-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
              title="Minhas Conquistas"
            >
              <Trophy className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Alternar Tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0 sm:h-[1.1rem] sm:w-[1.1rem]" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100 sm:h-[1.1rem] sm:w-[1.1rem]" />
          </Button>

          <div className="mx-1 h-4 w-px shrink-0 bg-border/60" />

          <UserDropdown user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
        </div>

        {showAchievements && (
          <DeferredAchievementsDialog open={showAchievements} onOpenChange={setShowAchievements} />
        )}
      </header>

      <div className="w-full min-w-0 border-b border-border bg-card px-2 py-2 sm:px-4 sm:py-2.5">
        <div className="mx-auto w-full max-w-[1600px]">
          <CityLastUpdatesTicker />
        </div>
      </div>
    </>
  );
}
