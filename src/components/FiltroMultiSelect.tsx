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
    <div className="group relative flex flex-col gap-1" ref={wrapperRef}>
      <span className="truncate pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </span>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full min-h-[38px] appearance-none rounded-lg border border-border text-left focus:outline-none",
            "bg-card px-3 py-1.5 pr-9 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150",
            "hover:border-primary/50 hover:bg-muted/30",
            isOpen ? "ring-2 ring-primary/20 border-primary" : "hover:ring-2 hover:ring-primary/5",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className="block truncate">
            {selected.length > 0 ? (
              <span className="text-primary font-bold">{selected.length} selecionado(s)</span>
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
          </span>
        </button>
        <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
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
