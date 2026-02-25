import React from 'react';

export type ViewMode = 'dia' | 'turno' | 'sub_praca' | 'origem' | 'ranking';

interface OperationalViewToggleProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const OperationalViewToggle: React.FC<OperationalViewToggleProps> = ({ viewMode, onViewModeChange }) => {
    return (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['dia', 'turno', 'sub_praca', 'origem', 'ranking'] as const).map((mode) => (
                <button
                    key={mode}
                    onClick={() => onViewModeChange(mode)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === mode
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                >
                    {mode === 'sub_praca' ? 'Sub Praça' : mode === 'ranking' ? 'Ranking Sub Praça' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
            ))}
        </div>
    );
};
