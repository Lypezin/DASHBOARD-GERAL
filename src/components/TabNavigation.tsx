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
    <div className="w-full flex overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
      <div
        className={cn(
          'mx-auto flex min-w-max items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 px-2 py-2 shadow-sm transition-[background-color,border-color,transform] duration-200 dark:border-slate-800/80 dark:bg-slate-900/95 sm:gap-2',
          variant === 'compact' ? 'origin-center sm:scale-[0.98]' : ''
        )}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'relative cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-200',
                'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
                isActive && 'bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="pointer-events-none absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
