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
        <div className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate pr-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={data.label}>
                    {data.label}
                </h3>
                <Badge variant={data.aderencia >= 90 ? 'default' : data.aderencia >= 70 ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5 font-medium shadow-none">
                    {data.aderencia.toFixed(1)}%
                </Badge>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${data.aderencia >= 70 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${barColor} rounded-full shadow-sm transition-all duration-1000`}
                            style={{ width: `${Math.min(data.aderencia, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Planejado</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-sm">{formatarHorasParaHMS(data.horasAEntregar)}</span>
                </div>
                <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Real</span>
                    <span className={`font-mono font-semibold text-sm ${statusColor}`}>{formatarHorasParaHMS(data.horasEntregues)}</span>
                </div>
            </div>
        </div>
    );
};
