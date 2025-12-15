import React from 'react';

type FilterOption = {
  value: string;
  label: string;
};

const FiltroSelect = React.memo(({ label, placeholder, options, value, onChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) => {
  return (
    <label className="flex flex-col gap-1 sm:gap-1.5">
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 truncate">{label}</span>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
          <svg className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {value && !disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="absolute right-8 sm:right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </label>
  );
});

FiltroSelect.displayName = 'FiltroSelect';

export default FiltroSelect;
