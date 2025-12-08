import React from 'react';

interface FilterModeSwitchProps {
    isModoIntervalo: boolean;
    onToggle: () => void;
}

export const FilterModeSwitch: React.FC<FilterModeSwitchProps> = ({ isModoIntervalo, onToggle }) => {
    return (
        <div className="flex items-center justify-center sm:justify-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <span className={`text-sm font-medium ${!isModoIntervalo ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                Ano/Semana
            </span>
            <button
                type="button"
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isModoIntervalo ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                role="switch"
                aria-checked={isModoIntervalo}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isModoIntervalo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
            <span className={`text-sm font-medium ${isModoIntervalo ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                Intervalo de Datas
            </span>
        </div>
    );
};
