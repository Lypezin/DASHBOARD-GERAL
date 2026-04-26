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
                <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 pl-1">
                    Data Inicial
                </label>
                <input
                    type="date"
                    value={tempDataInicial}
                    onChange={onChangeDataInicial}
                    min={minDate}
                    max={maxDate}
                    className="w-full min-w-0 rounded-xl border border-slate-200/60 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/90 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:bg-white dark:hover:bg-slate-700/90 hover:border-blue-400/50 dark:hover:border-blue-500/40"
                />
            </div>
            <div className="min-w-0 space-y-1">
                <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 pl-1">
                    Data Final
                </label>
                <input
                    type="date"
                    value={tempDataFinal}
                    onChange={onChangeDataFinal}
                    min={tempDataInicial || minDate}
                    max={maxDate}
                    className="w-full min-w-0 rounded-xl border border-slate-200/60 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/90 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:bg-white dark:hover:bg-slate-700/90 hover:border-blue-400/50 dark:hover:border-blue-500/40"
                />
            </div>
        </div>
    );
};
