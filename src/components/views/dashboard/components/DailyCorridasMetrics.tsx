import React from 'react';

interface DailyCorridasMetricsProps {
  ofertadas?: number;
  completadas?: number;
}

export const DailyCorridasMetrics: React.FC<DailyCorridasMetricsProps> = ({ ofertadas, completadas }) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full mt-3.5 pt-2.5 border-t border-border/40 select-none">
      <div className="flex flex-col items-center min-w-0">
        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-bold truncate w-full block">
          Ofertadas
        </span>
        <span className="text-xs font-bold text-foreground font-mono mt-0.5">
          {ofertadas?.toLocaleString('pt-BR') || 0}
        </span>
      </div>
      <div className="flex flex-col items-center min-w-0">
        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-bold truncate w-full block">
          Completas
        </span>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
          {completadas?.toLocaleString('pt-BR') || 0}
        </span>
      </div>
    </div>
  );
};

export default DailyCorridasMetrics;
