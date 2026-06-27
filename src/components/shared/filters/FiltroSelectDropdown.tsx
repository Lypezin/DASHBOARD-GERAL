import React from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFloatingDropdownPosition } from '@/hooks/ui/useFloatingDropdownPosition';
import { FilterOption } from './FiltroSelect';

interface FiltroSelectDropdownProps {
  isOpen: boolean;
  disabled?: boolean;
  options: FilterOption[];
  value: string | null;
  placeholder: string;
  onSelect: (value: string | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export const FiltroSelectDropdown: React.FC<FiltroSelectDropdownProps> = ({
  isOpen, disabled, options, value, placeholder, onSelect, dropdownRef, anchorRef
}) => {
  const position = useFloatingDropdownPosition({
    isOpen,
    anchorRef,
    itemCount: options.length,
    minWidth: 320,
    maxEstimatedHeight: 380,
    extraHeight: 58,
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
      className="fixed z-[100000] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_-34px_rgba(15,23,42,0.45)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 supports-[backdrop-filter]:backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/95 dark:shadow-black/50"
    >
      <ul
        className="subtle-scrollbar overflow-y-auto p-1.5"
        style={{ maxHeight: position.maxHeight }}
      >
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
    </div>,
    document.body
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
      title={label}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <div className={cn(
          "mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-transparent dark:border-slate-600"
        )}>
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </div>
        <span className="min-w-0 whitespace-normal break-words text-sm font-medium leading-snug">{label}</span>
      </div>
    </li>
  );
}
