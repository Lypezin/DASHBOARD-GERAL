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
}) => {
  const meta = formatarHorasParaHMS(horasAEntregar);
  const real = formatarHorasParaHMS(horasEntregues);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <MetricTile
        icon={Clock}
        label="Meta"
        value={meta}
        title={meta}
        className="text-slate-600 dark:text-slate-300"
      />
      <MetricTile
        icon={CheckCircle2}
        label="Real"
        value={real}
        title={real}
        className={statusColor}
      />
    </div>
  );
};

function MetricTile({
  icon: Icon,
  label,
  value,
  title,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  title: string;
  className: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 transition-colors duration-200 group-hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:group-hover:bg-slate-900/70">
      <div className="mb-1 flex items-center gap-1.5 text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
      <span className={cn("block truncate font-mono text-sm font-semibold", className)} title={title}>
        {value}
      </span>
    </div>
  );
}

export default OperationalDetailMetrics;
