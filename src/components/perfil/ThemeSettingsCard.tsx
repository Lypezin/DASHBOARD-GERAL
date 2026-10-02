import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSettingsCard = React.memo(function ThemeSettingsCard() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Aparência
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Preferências visuais
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste o tema usado no dashboard.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Modo escuro</p>
            <p className="text-xs text-muted-foreground">
              {isDark ? 'Ativado' : 'Desativado'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme} className="shrink-0 rounded-xl">
          Alternar
        </Button>
      </div>
    </section>
  );
});
