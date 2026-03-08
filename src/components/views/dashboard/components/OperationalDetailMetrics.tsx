import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';

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
        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm shadow-sm group-hover:bg-white/80 dark:group-hover:bg-slate-800/80 transition-colors">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Meta</span>
            </div>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm block truncate">
                {formatarHorasParaHMS(horasAEntregar)}
            </span>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm shadow-sm group-hover:bg-white/80 dark:group-hover:bg-slate-800/80 transition-colors">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Real</span>
            </div>
            <span className={`font-mono font-bold text-sm block truncate ${statusColor}`}>
                {formatarHorasParaHMS(horasEntregues)}
            </span>
        </div>
    </div>
);
