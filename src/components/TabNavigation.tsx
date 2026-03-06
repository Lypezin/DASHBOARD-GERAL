/**
 * Componente de navegação de tabs
 * Centraliza lógica de navegação entre diferentes visualizações
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  variant?: 'default' | 'compact';
}

export function TabNavigation({ activeTab, onTabChange, variant = 'default' }: TabNavigationProps) {
  const tabs: { label: string; value: TabType }[] = [
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Análise', value: 'analise' },
    { label: 'UTR', value: 'utr' },
    { label: 'Entregadores', value: 'entregadores' },
    { label: 'Valores', value: 'valores' },
    { label: 'Prioridade | Promo', value: 'prioridade' },
    { label: 'Evolução', value: 'evolucao' },
    { label: 'Comparação', value: 'comparacao' },
    { label: 'Operacional | Marketing', value: 'marketing_comparacao' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Resumo', value: 'resumo' },
  ];

  return (
    <div className="w-full flex overflow-x-auto pb-4 sm:pb-0 scrollbar-hide">
      <div className={cn(
        "flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 px-2 rounded-full shadow-sm min-w-max mx-auto md:mx-0 transition-transform duration-200",
        variant === 'compact' ? "scale-95 origin-left" : ""
      )}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative cursor-pointer text-sm font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap",
                "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                isActive && "text-slate-900 dark:text-white"
              )}
            >
              <span className="relative z-10">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-slate-100 dark:bg-slate-800 rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-900 dark:bg-slate-100 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-slate-900/20 dark:bg-slate-100/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-slate-900/20 dark:bg-slate-100/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-slate-900/20 dark:bg-slate-100/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
