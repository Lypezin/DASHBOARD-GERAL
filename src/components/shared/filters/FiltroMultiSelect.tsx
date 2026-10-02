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
      <span className="pl-1 text-xs font-semibold text-foreground">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={`${label}: ${selected.length ? selectedLabels.join(', ') : placeholder}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input text-left focus:outline-none",
            "bg-card px-3 py-1 pr-10 text-sm font-semibold text-foreground transition-[background-color,border-color,box-shadow] duration-200",
            "hover:border-primary/50 hover:bg-card",
            isOpen ? "border-blue-400 ring-2 ring-blue-500/20" : "",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          title={selected.length > 0 ? selectedLabels.join(', ') : placeholder}
        >
          <span className="block min-w-0 w-full truncate pr-1 leading-snug">
            {selected.length > 0 ? isWeekFilter ? (
              <span className="flex items-center gap-1 overflow-hidden">
                {selectedLabels.slice(0, 3).map((week, index) => (
                  <span key={`${week}-${index}`} className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary">{week}</span>
                ))}
                {selectedLabels.length > 3 && <span className="text-xs text-muted-foreground">+{selectedLabels.length - 3}</span>}
              </span>
            ) : (
              <span className="block truncate font-semibold text-primary" title={selectedLabels.join(', ')}>
                {selectedDisplay}
              </span>
            ) : (
              <span className="block truncate font-normal text-muted-foreground">{placeholder}</span>
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
