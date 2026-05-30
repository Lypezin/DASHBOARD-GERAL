import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterOption } from './FiltroSelect';

interface FiltroSelectDropdownProps {
  isOpen: boolean;
  disabled?: boolean;
  options: FilterOption[];
  value: string | null;
  placeholder: string;
  onSelect: (value: string | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export const FiltroSelectDropdown: React.FC<FiltroSelectDropdownProps> = ({
  isOpen, disabled, options, value, placeholder, onSelect, dropdownRef
}) => {
  return (
    <>
      {isOpen && !disabled && options.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 shadow-xl shadow-slate-900/10 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 supports-[backdrop-filter]:backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95 dark:shadow-black/30"
        >
          <ul className="subtle-scrollbar max-h-60 overflow-y-auto p-1.5">
            <DropdownOption
              selected={!value}
              label={placeholder || 'Todos'}
              onClick={() => onSelect(null)}
            />

            {options.map((option) => (
              <DropdownOption
                key={option.value}
                selected={value === option.value}
                label={option.label}
                onClick={() => onSelect(option.value)}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

function DropdownOption({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <li
      className={cn(
        "mb-0.5 flex cursor-pointer items-center rounded-lg p-2.5 last:mb-0",
        "transition-[background-color,color] duration-150 hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
        selected ? "bg-blue-50/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      )}
      onClick={onClick}
    >
      <div className="flex flex-1 items-center">
        <div className={cn(
          "mr-3 flex h-4 w-4 items-center justify-center rounded border transition-colors",
          selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-transparent dark:border-slate-600"
        )}>
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </div>
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
    </li>
  );
}
