import React, { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltroSelectDropdown } from './FiltroSelectDropdown';

export type FilterOption = {
  value: string;
  label: string;
};

const FiltroSelect = React.memo(({ label, placeholder, options, value, onChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
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
    <div className="group relative flex min-w-0 flex-col gap-1" ref={wrapperRef}>
      <span className="pl-1 text-xs font-semibold text-foreground">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={`${label}: ${selectedOption?.label || placeholder}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input text-left focus:outline-none",
            "bg-card px-3 py-1 text-sm font-semibold text-foreground transition-[background-color,border-color,box-shadow] duration-200",
            "hover:border-primary/50 hover:bg-card",
            isOpen ? "border-blue-400 ring-2 ring-blue-500/20" : "",
            value ? "pr-16" : "pr-10",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          title={selectedOption?.label || placeholder}
        >
          <span className="block min-w-0 pr-1 leading-snug truncate w-full">
            {selectedOption ? (
              <span className="block truncate font-semibold text-primary">{selectedOption.label}</span>
            ) : (
              <span className="block truncate font-normal text-muted-foreground">{placeholder}</span>
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
