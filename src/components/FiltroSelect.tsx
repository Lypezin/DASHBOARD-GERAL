import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 truncate pl-1">
        {label}
      </span>
      <div className="relative group">
        <select
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-200/60 dark:border-slate-700/60",
            "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2.5 text-sm font-medium",
            "text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300",
            "hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-blue-400/50 hover:shadow-md",
            "hover:ring-2 hover:ring-blue-500/20",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
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

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:translate-y-[-40%]">
          <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>

        {value && !disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors bg-white/50 dark:bg-slate-800/50 rounded-full p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </label>
  );
});

FiltroSelect.displayName = 'FiltroSelect';

export default FiltroSelect;
