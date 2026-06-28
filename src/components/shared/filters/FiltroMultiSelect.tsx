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

  const isWeekFilter = label.toLowerCase().includes('semana');
  const selectedLabels = selected
    .map((item) => options.find((option) => option.value === item)?.label || item)
    .map((item) => isWeekFilter ? item.replace(/^Semana\s*/i, '') : item);

  const selectedDisplay = isWeekFilter
    ? selectedLabels.length <= 2
      ? `Sem ${selectedLabels.join(', ')}`
      : `Sem ${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`
    : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;

  return (
    <div className="group relative flex min-w-0 flex-col gap-1" ref={wrapperRef}>
      <span className="pl-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "h-[38px] w-full appearance-none rounded-lg border border-slate-200/80 text-left focus:outline-none dark:border-slate-800",
            "bg-white px-3 py-1 pr-10 text-xs font-semibold text-slate-900 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 dark:bg-slate-900 dark:text-slate-100",
            "hover:border-blue-300 hover:bg-white hover:shadow-md motion-safe:hover:-translate-y-0.5 dark:hover:border-blue-500/50 dark:hover:bg-slate-900",
            isOpen ? "border-blue-400 ring-2 ring-blue-500/20" : "",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          title={selected.length > 0 ? selectedLabels.join(', ') : placeholder}
        >
          <span className={cn("block min-w-0 pr-1 leading-snug truncate w-full", isWeekFilter ? "whitespace-nowrap font-mono text-[13px] tabular-nums" : "")}>
            {selected.length > 0 ? (
              <span className="block truncate font-semibold text-blue-700 dark:text-blue-300" title={selectedLabels.join(', ')}>
                {selectedDisplay}
              </span>
            ) : (
              <span className="block truncate font-normal text-slate-400">{placeholder}</span>
            )}
          </span>
        </button>
        <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      <FiltroMultiSelectDropdown
        isOpen={isOpen}
        disabled={disabled}
        options={options}
        selected={selected}
        onSelect={handleSelect}
        dropdownRef={dropdownRef}
        anchorRef={wrapperRef}
      />
    </div>
  );
});

FiltroMultiSelect.displayName = 'FiltroMultiSelect';

export default FiltroMultiSelect;
