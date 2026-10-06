import React, { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltroSelectDropdown } from './FiltroSelectDropdown';

export type FilterOption = {
  value: string;
  label: string;
};

const FiltroSelect = React.memo(({ label, placeholder, options, value, onChange, disabled = false, appearance = 'default' }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  appearance?: 'default' | 'quiet';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const refsToCheck = useRef([wrapperRef, dropdownRef]);
  useClickOutside(refsToCheck.current, closeDropdown);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (selectedValue: string | null) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="group relative flex min-w-0 flex-col gap-1" ref={wrapperRef} data-filter-role="single-select">
      <span className={cn("pl-1 text-[11px] font-bold text-slate-600 dark:text-slate-300", appearance === 'quiet' && "pl-0 font-semibold")}>
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "h-[38px] w-full appearance-none rounded-lg border border-slate-200/80 text-left focus:outline-none dark:border-slate-800",
            "bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 dark:bg-slate-900 dark:text-slate-100",
            "hover:border-blue-300 hover:bg-white hover:shadow-md motion-safe:hover:-translate-y-0.5 dark:hover:border-blue-500/50 dark:hover:bg-slate-900",
            isOpen
              ? appearance === 'quiet' ? "border-sky-700 ring-2 ring-sky-600/10 dark:border-sky-400" : "border-blue-400 ring-2 ring-blue-500/20"
              : "",
            value ? "pr-16" : "pr-10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            appearance === 'quiet' && "rounded-lg border-[#d3e1e9] bg-white font-medium shadow-none hover:translate-y-0 hover:border-sky-600 hover:bg-white hover:shadow-none dark:border-slate-700 dark:bg-slate-950 dark:hover:border-sky-400"
          )}
          data-filter-trigger="single-select"
          title={selectedOption?.label || placeholder}
        >
          <span className="block min-w-0 pr-1 leading-snug truncate w-full">
            {selectedOption ? (
                <span className={cn("block truncate font-semibold text-blue-700 dark:text-blue-300", appearance === 'quiet' && "font-medium text-slate-800 dark:text-slate-100")}>{selectedOption.label}</span>
            ) : (
              <span className="block truncate font-normal text-slate-400">{placeholder}</span>
            )}
          </span>
        </button>

        <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-md bg-slate-100 p-0.5 text-slate-400 transition-colors hover:text-rose-500 dark:bg-slate-800"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <FiltroSelectDropdown
        appearance={appearance}
        isOpen={isOpen}
        disabled={disabled}
        options={options}
        value={value}
        placeholder={placeholder}
        onSelect={handleSelect}
        dropdownRef={dropdownRef}
        anchorRef={wrapperRef}
      />
    </div>
  );
});

FiltroSelect.displayName = 'FiltroSelect';

export default FiltroSelect;
