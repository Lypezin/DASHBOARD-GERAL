import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';

interface DetailData {
    label: string;
    aderencia: number;
    horasAEntregar: number | string;
    horasEntregues: number | string;
}

interface OperationalDetailCardProps {
    data: DetailData;
}

export const OperationalDetailCard: React.FC<OperationalDetailCardProps> = ({ data }) => {
    const statusColor = data.aderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
        data.aderencia >= 70 ? 'text-blue-600 dark:text-blue-400' :
            'text-rose-600 dark:text-rose-400';

    const barColor = data.aderencia >= 90 ? 'bg-emerald-500' :
        data.aderencia >= 70 ? 'bg-blue-500' :
            'bg-rose-500';

    const Icon = data.aderencia >= 70 ? TrendingUp : TrendingDown;

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/50 dark:ring-slate-800 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:ring-blue-500/20 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate pr-2 tracking-tight" title={data.label}>
                    {data.label}
                </h3>
                <Badge variant={data.aderencia >= 90 ? 'default' : data.aderencia >= 70 ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5 font-medium shadow-sm">
                    {data.aderencia.toFixed(1)}%
                </Badge>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${data.aderencia >= 70 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${barColor} rounded-full shadow-sm`}
                            style={{ width: `${Math.min(data.aderencia, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(data.horasAEntregar)}</span>
                </div>
                <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Real</span>
                    <span className={`font-mono font-semibold ${statusColor}`}>{formatarHorasParaHMS(data.horasEntregues)}</span>
                </div>
            </div>
        </div>
    );
};
