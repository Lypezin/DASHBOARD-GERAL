'use client';

import React from 'react';
import { BarChart3, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type DedicadoSubTab = 'dashboard' | 'entregadores' | 'ranking' | 'resumo' | 'dia_origem';

interface SubTabItem {
  id: DedicadoSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DedicadoHeaderProps {
  activeSubTab: DedicadoSubTab;
  setActiveSubTab: (tab: DedicadoSubTab) => void;
  subTabs: SubTabItem[];
  isExporting: boolean;
  onExport: () => void;
}

export const DedicadoHeader = React.memo(function DedicadoHeader({
  activeSubTab,
  setActiveSubTab,
  subTabs,
  isExporting,
  onExport,
}: DedicadoHeaderProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:via-slate-950 dark:to-slate-950 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <BarChart3 className="h-3.5 w-3.5" />
            Origem
          </div>
          <h2 className="break-words text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            DEDICADO
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Visao separada para restaurantes e origens, com entregadores, resumo por origem e matriz Dia x Origem no mesmo lugar.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-500/40 sm:w-auto xl:self-end"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Baixar Excel'}
          </button>

          <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white/85 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:grid-cols-3 xl:grid-cols-5 xl:self-stretch">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    'relative inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition-all sm:gap-2 sm:px-3.5 sm:text-xs focus:outline-none',
                    active
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activeSubTab"
                      className="absolute inset-0 rounded-xl bg-blue-600 shadow-sm shadow-blue-600/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0 relative z-10" />
                  <span className="min-w-0 text-center leading-tight relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
