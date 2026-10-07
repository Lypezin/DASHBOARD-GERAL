import React from 'react';
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
    <dl className="grid grid-cols-2 divide-x divide-[#e2ebf0] border-y border-[#e2ebf0] py-2.5 dark:divide-slate-800 dark:border-slate-800">
      <div className="min-w-0 pr-3">
        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Horas planejadas</dt>
        <dd className="mt-0.5 truncate font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200" title={meta}>{meta}</dd>
      </div>
      <div className="min-w-0 pl-3">
        <dt className="text-[10px] text-slate-500 dark:text-slate-400">Horas entregues</dt>
        <dd className={cn("mt-0.5 truncate font-mono text-xs font-semibold tabular-nums", statusColor)} title={real}>{real}</dd>
      </div>
    </dl>
  );
};

export default OperationalDetailMetrics;
