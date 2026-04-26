import React, { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltroMultiSelectDropdown } from './FiltroMultiSelectDropdown';

type FilterOption = {
  value: string;
  label: string;
};

const FiltroMultiSelect = React.memo(({ label, placeholder, options, selected, onSelectionChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const refsToCheck = useRef([wrapperRef, dropdownRef]);
  useClickOutside(refsToCheck.current, closeDropdown);

  const handleSelect = (value: string) => {
    const isAlreadySelected = selected.includes(value);
    const newSelected = isAlreadySelected
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onSelectionChange(newSelected);
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 relative group" ref={wrapperRef}>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate pl-1">
        {label}
      </span>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full text-left appearance-none rounded-xl border border-slate-200/60 dark:border-slate-700/80",
            "bg-slate-50/80 dark:bg-slate-800/90 supports-[backdrop-filter]:backdrop-blur-sm px-3 py-2.5 pr-8 text-sm font-medium",
            "text-slate-700 dark:text-slate-200 shadow-sm transition-[background-color,border-color,box-shadow] duration-150",
            "hover:bg-white dark:hover:bg-slate-700/90 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:shadow-md",
            isOpen ? "ring-2 ring-blue-500/40 border-blue-500 dark:border-blue-500/60" : "hover:ring-2 hover:ring-blue-500/20 dark:hover:ring-blue-500/30",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className="block truncate">
            {selected.length > 0 ? (
              <span className="text-blue-600 dark:text-blue-400">{selected.length} selecionado(s)</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-normal">{placeholder}</span>
            )}
          </span>
        </button>
        <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      <FiltroMultiSelectDropdown
        isOpen={isOpen}
        disabled={disabled}
        options={options}
        selected={selected}
        onSelect={handleSelect}
        dropdownRef={dropdownRef}
      />
    </div>
  );
});

FiltroMultiSelect.displayName = 'FiltroMultiSelect';

export default FiltroMultiSelect;
