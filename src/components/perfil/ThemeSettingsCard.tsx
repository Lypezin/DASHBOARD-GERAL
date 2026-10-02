import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSettingsCard = React.memo(function ThemeSettingsCard() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="rounded-[1.65rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_56px_-48px_rgba(15,23,42,0.45)] dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
          Aparência
        </p>
        <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">
          Preferências visuais
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Ajuste o tema usado no dashboard.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/55">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-amber-500/10 text-amber-600'}`}>
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Modo escuro</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
