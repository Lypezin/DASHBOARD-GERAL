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
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-4 py-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] backdrop-blur transition-all duration-200 sm:px-6 lg:px-8">
      {/* Esquerda: Menu toggle + Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Toggle para Desktop / Mobile */}
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

        <div className="hidden h-4 w-px bg-border/80 sm:block shrink-0" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:text-sm shrink-0">
          <span className="font-medium text-muted-foreground/72">{breadcrumb.group}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="font-bold text-foreground">{breadcrumb.label}</span>
        </nav>
      </div>

      {/* Centro: Ticker de Cidades Sincronizadas Permanente em Desktop */}
      <div className="hidden lg:flex flex-1 max-w-[28rem] xl:max-w-[46rem] mx-8 overflow-hidden">
        <CityLastUpdatesTicker />
      </div>

      {/* Direita: Conquistas + Tema + Perfil */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Conquistas (Apenas se logado) */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAchievements(true)}
            className="h-9 w-9 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20"
            title="Minhas Conquistas"
          >
            <Trophy className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
          </Button>
        )}

        {/* Alternador de Tema */}
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

        <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

        {/* Perfil dropdown */}
        <UserDropdown user={user} avatarUrl={avatarUrl} onLogout={handleLogout} />
      </div>

      {/* Modal Achievements */}
      {showAchievements && (
        <DeferredAchievementsDialog open={showAchievements} onOpenChange={setShowAchievements} />
      )}
    </header>
  );
}
