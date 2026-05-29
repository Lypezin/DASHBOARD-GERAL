import React from 'react';
import { cn } from '@/lib/utils';

interface DateRangeInputsProps {
  tempDataInicial: string;
  tempDataFinal: string;
  onChangeDataInicial: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeDataFinal: (e: React.ChangeEvent<HTMLInputElement>) => void;
  minDate: string;
  maxDate: string;
}

export const DateRangeInputs: React.FC<DateRangeInputsProps> = ({
  tempDataInicial,
  tempDataFinal,
  onChangeDataInicial,
  onChangeDataFinal,
  minDate,
  maxDate,
}) => {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="min-w-0 flex flex-col gap-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
          Data Inicial
        </label>
        <input
          type="date"
          value={tempDataInicial}
          onChange={onChangeDataInicial}
          min={minDate}
          max={maxDate}
          className={cn(
            "w-full min-w-0 h-[38px] rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150",
            "hover:border-primary/50 hover:bg-muted/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "dark:hover:bg-slate-800/50"
          )}
        />
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
          Data Final
        </label>
        <input
          type="date"
          value={tempDataFinal}
          onChange={onChangeDataFinal}
          min={tempDataInicial || minDate}
          max={maxDate}
          className={cn(
            "w-full min-w-0 h-[38px] rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150",
            "hover:border-primary/50 hover:bg-muted/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "dark:hover:bg-slate-800/50"
          )}
        />
      </div>
    </div>
  );
};
