import React from 'react';

interface ResumoFilterDropdownProps {
    filterOpen: boolean;
    setFilterOpen: (open: boolean) => void;
    selectedPracas: string[];
    pracasDisponiveis: string[];
    onClearFilter: () => void;
    onFilterToggle: (praca: string) => void;
}

export const ResumoFilterDropdown: React.FC<ResumoFilterDropdownProps> = ({
    filterOpen,
    setFilterOpen,
    selectedPracas,
    pracasDisponiveis,
    onClearFilter,
    onFilterToggle
}) => {
    if (!filterOpen) return null;

    return (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecione as Praças</span>
                {selectedPracas.length > 0 && (
                    <button
                        onClick={() => { onClearFilter(); setFilterOpen(false); }}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                        Limpar
                    </button>
                )}
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
                {pracasDisponiveis.map((praca) => (
                    <label
                        key={praca}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={selectedPracas.includes(praca)}
                            onChange={() => onFilterToggle(praca)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{praca}</span>
                    </label>
                ))}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setFilterOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Aplicar
                </button>
            </div>
        </div>
    );
};
