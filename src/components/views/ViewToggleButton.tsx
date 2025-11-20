/**
 * Componente para alternar entre visualização de tabela e gráfico
 * Reutilizável em diferentes views
 */
import React from 'react';

interface ViewToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export const ViewToggleButton = React.memo(function ViewToggleButton({
  active,
  onClick,
  label,
}: ViewToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
});

ViewToggleButton.displayName = 'ViewToggleButton';

