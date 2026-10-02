import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterClearButtonProps {
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

export const FilterClearButton: React.FC<FilterClearButtonProps> = ({ onClear, disabled = false, className }) => {
  return (
    <div className={cn("flex w-full flex-col gap-1 sm:w-auto", className)}>
      <span className="sr-only">
        Acao
      </span>
      <button
        onClick={onClear}
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-3 text-sm font-semibold text-primary transition-colors sm:w-auto",
          "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Limpar
      </button>
    </div>
  );
};

export default FilterClearButton;
