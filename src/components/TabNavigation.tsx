/**
 * Componente de navegação de tabs
 * Centraliza lógica de navegação entre diferentes visualizações
 */

import { TabType } from '@/types';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
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
    { label: 'Comparar', value: 'comparacao' },
    { label: 'Marketing', value: 'marketing' },
  ];

  if (variant === 'compact') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex gap-2 pb-2">
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
    <div className="relative group z-0">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative bg-gradient-to-br from-white via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/10 rounded-3xl border-0 shadow-xl p-4 sm:p-6 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex gap-3 pb-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.value}
              label={tab.label}
              active={activeTab === tab.value}
              onClick={() => {
                onTabChange(tab.value);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

