import React from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFloatingDropdownPosition } from '@/hooks/ui/useFloatingDropdownPosition';
import { FilterOption } from './FiltroSelect';

interface FiltroMultiSelectDropdownProps {
  appearance?: 'default' | 'quiet';
  isOpen: boolean;
  disabled?: boolean;
  options: FilterOption[];
  selected: string[];
  onSelect: (value: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export const FiltroMultiSelectDropdown: React.FC<FiltroMultiSelectDropdownProps> = ({
  appearance = 'default', isOpen, disabled, options, selected, onSelect, dropdownRef, anchorRef
}) => {
  const position = useFloatingDropdownPosition({
    isOpen,
    anchorRef,
    itemCount: options.length,
    minWidth: 340,
    maxEstimatedHeight: 400,
    extraHeight: 24,
  });

  if (!isOpen || disabled || options.length === 0 || !position || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        left: position.left,
        top: position.top,
        bottom: position.bottom,
        width: position.width,
      }}
      className={appearance === 'quiet'
        ? 'fixed z-[100000] overflow-hidden rounded-lg border border-[#d6dcd5] bg-[#fbfcf9] shadow-[0_8px_18px_-12px_rgba(20,32,24,0.22)] animate-in fade-in-0 slide-in-from-top-1 duration-150 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30'
        : 'fixed z-[100000] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_-34px_rgba(15,23,42,0.45)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 supports-[backdrop-filter]:backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/95 dark:shadow-black/50'}
    >
      <ul
        className="subtle-scrollbar overflow-y-auto p-1.5"
        style={{ maxHeight: position.maxHeight }}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <li
              key={option.value}
              className={cn(
                "mb-0.5 flex cursor-pointer items-center p-2.5 last:mb-0 transition-[background-color,color] duration-150",
                appearance === 'quiet'
                  ? isSelected ? 'rounded-lg bg-[#315c49]/10 text-[#315c49] dark:bg-emerald-950/50 dark:text-emerald-100' : 'rounded-lg text-[#4f5c53] hover:bg-[#eef1ec] hover:text-[#242b26] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  : isSelected ? 'rounded-xl bg-blue-50/80 text-blue-700 hover:bg-blue-50/80 dark:bg-blue-900/25 dark:text-blue-300 dark:hover:bg-blue-900/25' : 'rounded-xl text-slate-700 hover:bg-blue-50/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-blue-950/30 dark:hover:text-slate-100'
              )}
              onClick={() => onSelect(option.value)}
              title={option.label}
            >
              <div className="flex min-w-0 flex-1 items-center">
                <div className={cn(
                  "mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  isSelected
                    ? appearance === 'quiet' ? 'border-[#315c49] bg-[#315c49] text-white dark:border-emerald-200 dark:bg-emerald-200 dark:text-[#19221c]' : 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-transparent dark:border-slate-600'
                )}>
                  {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                <span className="min-w-0 whitespace-normal break-words text-sm font-medium leading-snug">{option.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body
  );
};
