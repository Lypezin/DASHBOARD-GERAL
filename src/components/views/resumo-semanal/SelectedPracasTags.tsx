import React from 'react';

interface SelectedPracasTagsProps {
    selectedPracas: string[];
    togglePraca: (praca: string) => void;
}

export const SelectedPracasTags: React.FC<SelectedPracasTagsProps> = ({ selectedPracas, togglePraca }) => {
    if (selectedPracas.length === 0) return null;

    return (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
            {selectedPracas.map(praca => (
                <span
                    key={praca}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    onClick={() => togglePraca(praca)}
                >
                    {praca}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </span>
            ))}
        </div>
    );
};
