import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeActionsProps {
  onApply: () => void;
  onClear: () => void;
  canApply: boolean;
  hasFilter: boolean;
  appearance?: 'default' | 'quiet';
}

export const DateRangeActions: React.FC<DateRangeActionsProps> = ({
  onApply,
  onClear,
  canApply,
  hasFilter,
  appearance = 'default',
}) => {
  const quiet = appearance === 'quiet';
  return (
    <div className="flex w-full flex-shrink-0 flex-col gap-1 sm:w-auto" data-filter-role="range-actions">
      {/* Label estrutural invisível para simetria de alinhamento com os inputs de data ao lado */}
      <span className="block h-[15px] select-none text-[10px] font-bold uppercase tracking-wider text-transparent">
        Ações
      </span>
      <div className="flex w-full gap-2 items-center">
        <Button
          onClick={onApply}
          disabled={!canApply}
          className={cn(
            "h-[38px] flex-1 bg-primary text-primary-foreground hover:bg-primary/90 sm:min-w-[80px] sm:flex-none rounded-lg text-xs font-bold shadow-sm",
            quiet && 'h-10 rounded-lg border border-sky-700 bg-sky-700 font-semibold text-white shadow-none hover:border-sky-800 hover:bg-sky-800 dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950 dark:hover:border-sky-300 dark:hover:bg-sky-300'
          )}
          title={canApply ? 'Aplicar filtro de datas' : 'Nenhuma alteração para aplicar'}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Aplicar
        </Button>
        {hasFilter && (
          <Button
            variant="outline"
            onClick={onClear}
            className={cn(
              'h-[38px] flex-1 rounded-lg text-xs font-bold sm:min-w-[80px] sm:flex-none',
              quiet && 'h-10 border-[#d3e1e9] bg-white font-semibold text-slate-600 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            title="Limpar filtro de datas"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};
