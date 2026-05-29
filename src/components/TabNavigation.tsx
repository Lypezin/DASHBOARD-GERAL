'use client';

/**
 * Componente de navegacao de tabs
 * Centraliza logica de navegacao entre diferentes visualizacoes
 */

import React from 'react';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  variant?: 'default' | 'compact';
}

const TABS: { label: string; value: TabType }[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Analise', value: 'analise' },
  { label: 'UTR', value: 'utr' },
  { label: 'Entregadores', value: 'entregadores' },
  { label: 'Valores', value: 'valores' },
  { label: 'Prioridade | Promo', value: 'prioridade' },
  { label: 'Evolucao', value: 'evolucao' },
  { label: 'Comparacao', value: 'comparacao' },
  { label: 'Operacional | Marketing', value: 'marketing_comparacao' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'DEDICADO', value: 'dedicado' },
];

export function TabNavigation({ activeTab, onTabChange, variant = 'default' }: TabNavigationProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 sm:block" />
      <div className="subtle-scrollbar flex w-full overflow-x-auto pb-3 sm:pb-1">
        <div
          role="tablist"
          aria-label="Navegacao de visualizacoes"
          className={cn(
            'mx-auto flex min-w-max items-center gap-1 rounded-[1.45rem] border border-slate-200/70 bg-white/82 p-1.5 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.7)] ring-1 ring-white/70 transition-[background-color,border-color,transform,box-shadow] duration-200 dark:border-slate-800/70 dark:bg-slate-950/78 dark:ring-white/5 supports-[backdrop-filter]:backdrop-blur-xl sm:gap-1.5',
            variant === 'compact' ? 'origin-center sm:scale-[0.985]' : ''
          )}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange(tab.value)}
                className={cn(
                  'relative cursor-pointer whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-[color,background-color,box-shadow,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-4',
                  'text-slate-500 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
                  isActive && 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white shadow-[0_14px_26px_-18px_rgba(37,99,235,0.92)] hover:text-white'
                )}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="pointer-events-none absolute inset-x-5 -bottom-1 h-1 rounded-full bg-blue-400/80 blur-[1px]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
