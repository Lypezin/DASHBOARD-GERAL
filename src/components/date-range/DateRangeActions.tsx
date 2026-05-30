import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeActionsProps {
  onApply: () => void;
  onClear: () => void;
  canApply: boolean;
  hasFilter: boolean;
}

export const DateRangeActions: React.FC<DateRangeActionsProps> = ({
  onApply,
  onClear,
  canApply,
  hasFilter,
}) => {
  return (
    <div className="flex w-full flex-shrink-0 flex-col gap-1 sm:w-auto">
      {/* Label estrutural invisível para simetria de alinhamento com os inputs de data ao lado */}
      <span className="block h-[15px] select-none text-[10px] font-bold uppercase tracking-wider text-transparent">
        Ações
      </span>
      <div className="flex w-full gap-2 items-center">
        <Button
          onClick={onApply}
          disabled={!canApply}
          className={cn(
            "h-[38px] flex-1 bg-primary text-primary-foreground hover:bg-primary/90 sm:min-w-[80px] sm:flex-none rounded-lg text-xs font-bold shadow-sm"
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
            className="h-[38px] flex-1 sm:min-w-[80px] sm:flex-none rounded-lg text-xs font-bold"
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
