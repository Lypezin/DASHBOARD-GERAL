import React from 'react';

interface DateRangeInputsProps {
    tempDataInicial: string;
    tempDataFinal: string;
    onChangeDataInicial: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeDataFinal: (e: React.ChangeEvent<HTMLInputElement>) => void;
    minDate: string;
    maxDate: string;
}

export const DateRangeInputs: React.FC<DateRangeInputsProps> = ({
    tempDataInicial,
    tempDataFinal,
    onChangeDataInicial,
    onChangeDataFinal,
    minDate,
    maxDate,
}) => {
    return (
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Data Inicial
                </label>
                <input
                    type="date"
                    value={tempDataInicial}
                    onChange={onChangeDataInicial}
                    min={minDate}
                    max={maxDate}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
            </div>
            <div className="min-w-0 space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Data Final
                </label>
                <input
                    type="date"
                    value={tempDataFinal}
                    onChange={onChangeDataFinal}
                    min={tempDataInicial || minDate}
                    max={maxDate}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
            </div>
        </div>
    );
};
