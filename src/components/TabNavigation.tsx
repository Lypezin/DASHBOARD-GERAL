/**
 * Componente de navegação de tabs
 * Centraliza lógica de navegação entre diferentes visualizações
 */

import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
        active
          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {label}
    </button>
  );
}

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
    { label: 'Prioridade/Promo', value: 'prioridade' },
    { label: 'Evolução', value: 'evolucao' },
    { label: 'Comparação', value: 'comparacao' },
    { label: 'Operacional x Marketing', value: 'marketing_comparacao' },
    { label: 'Marketing', value: 'marketing' },
  ];

  if (variant === 'compact') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <TabButton
              key={tab.value}
              label={tab.label}
              active={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-2 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {tabs.map((tab) => (
          <TabButton
            key={tab.value}
            label={tab.label}
            active={activeTab === tab.value}
            onClick={() => onTabChange(tab.value)}
          />
        ))}
      </div>
    </div>
  );
}
