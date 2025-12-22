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
        <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate pr-2" title={data.label}>
                    {data.label}
                </h3>
                <Badge variant={data.aderencia >= 90 ? 'default' : data.aderencia >= 70 ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5 font-normal">
                    {data.aderencia.toFixed(1)}%
                </Badge>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${data.aderencia >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                    <Icon className={`h-4 w-4 ${statusColor}`} />
                </div>
                <div className="flex-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${barColor} rounded-full`}
                            style={{ width: `${Math.min(data.aderencia, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                    <span>Plan:</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatarHorasParaHMS(data.horasAEntregar)}</span>
                </div>
                <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                    <span>Real:</span>
                    <span className={`font-mono font-medium ${statusColor}`}>{formatarHorasParaHMS(data.horasEntregues)}</span>
                </div>
            </div>
        </div>
    );
};
