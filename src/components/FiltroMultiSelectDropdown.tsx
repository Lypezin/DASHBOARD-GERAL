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
          className="absolute top-full left-0 w-full mt-2 rounded-xl bg-white/95 dark:bg-slate-900/95 supports-[backdrop-filter]:backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50 z-[9999] overflow-hidden animate-fade-in"
        >
          <ul className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <li
                  key={option.value}
                  className={cn(
                    "p-2.5 cursor-pointer rounded-lg flex items-center mb-0.5 last:mb-0",
                    "transition-[background-color,color] duration-150 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                    isSelected ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                  onClick={() => onSelect(option.value)}
                >
                  <div className="flex items-center flex-1">
                    <div className={cn(
                      "mr-3 flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-transparent"
                    )}>
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
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
