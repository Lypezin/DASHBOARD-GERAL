import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface OperationalDetailMetricsProps {
  horasAEntregar: number | string;
  horasEntregues: number | string;
  statusColor: string;
}

export const OperationalDetailMetrics: React.FC<OperationalDetailMetricsProps> = ({
  horasAEntregar,
  horasEntregues,
  statusColor
}) => (
  <div className="grid grid-cols-2 gap-3 pt-1">
    {/* Bloco Meta */}
    <div className={cn(
      "bg-muted/30 dark:bg-muted/10 rounded-lg p-2.5 border border-border/60 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors duration-200",
      "group-hover:bg-muted/40 dark:group-hover:bg-muted/20"
    )}>
      <div className="flex items-center gap-1.5 mb-1 text-muted-foreground/80">
        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="text-[10px] uppercase font-bold tracking-wider">Meta</span>
      </div>
      <span className="font-mono font-bold text-foreground text-sm block truncate">
        {formatarHorasParaHMS(horasAEntregar)}
      </span>
    </div>

    {/* Bloco Real */}
    <div className={cn(
      "bg-muted/30 dark:bg-muted/10 rounded-lg p-2.5 border border-border/60 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-colors duration-200",
      "group-hover:bg-muted/40 dark:group-hover:bg-muted/20"
    )}>
      <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
        <span className="text-[10px] uppercase font-bold tracking-wider">Real</span>
      </div>
      <span className={cn("font-mono font-bold text-sm block truncate", statusColor)}>
        {formatarHorasParaHMS(horasEntregues)}
      </span>
    </div>
  </div>
);

export default OperationalDetailMetrics;
