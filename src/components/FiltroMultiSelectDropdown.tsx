import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterOption } from './FiltroSelect';

interface FiltroMultiSelectDropdownProps {
  isOpen: boolean;
  disabled?: boolean;
  options: FilterOption[];
  selected: string[];
  onSelect: (value: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export const FiltroMultiSelectDropdown: React.FC<FiltroMultiSelectDropdownProps> = ({
  isOpen, disabled, options, selected, onSelect, dropdownRef
}) => {
  return (
    <>
      {isOpen && !disabled && options.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 shadow-xl shadow-slate-900/10 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 supports-[backdrop-filter]:backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95 dark:shadow-black/30"
        >
          <ul className="subtle-scrollbar max-h-60 overflow-y-auto p-1.5">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <li
                  key={option.value}
                  className={cn(
                    "mb-0.5 flex cursor-pointer items-center rounded-lg p-2.5 last:mb-0",
                    "transition-[background-color,color] duration-150 hover:bg-blue-50/80 dark:hover:bg-blue-950/30",
                    isSelected ? "bg-blue-50/80 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  )}
                  onClick={() => onSelect(option.value)}
                >
                  <div className="flex min-w-0 flex-1 items-center">
                    <div className={cn(
                      "mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-transparent dark:border-slate-600"
                    )}>
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <span className="truncate text-sm font-medium">{option.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};
