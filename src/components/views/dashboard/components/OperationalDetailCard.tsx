import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Info, Clock, CheckCircle2 } from 'lucide-react';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const isHighPerf = data.aderencia >= 90;
    const isMidPerf = data.aderencia >= 70;

    const statusColor = isHighPerf ? 'text-emerald-600 dark:text-emerald-400' :
        isMidPerf ? 'text-blue-600 dark:text-blue-400' :
            'text-rose-600 dark:text-rose-400';

    const barColor = isHighPerf ? 'bg-emerald-500' :
        isMidPerf ? 'bg-blue-500' :
            'bg-rose-500';

    const bgGradient = isHighPerf
        ? 'bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/10'
        : isMidPerf
            ? 'bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-900/10'
            : 'bg-gradient-to-br from-white to-rose-50/50 dark:from-slate-900 dark:to-rose-900/10';

    const Icon = isMidPerf ? TrendingUp : TrendingDown;
    const iconColor = isHighPerf ? 'text-emerald-500' : isMidPerf ? 'text-blue-500' : 'text-rose-500';

    return (
        <TooltipProvider>
            <Card className={`border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${bgGradient}`}>
                <div className={`absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-10 transition-opacity`}>
                    <Icon className="w-24 h-24 text-current transform -rotate-12" />
                </div>

                <CardContent className="p-5 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 max-w-[70%]">
                            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate tracking-tight" title={data.label}>
                                {data.label}
                            </h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="text-slate-400 hover:text-blue-500 transition-colors focus:outline-none">
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{data.label}</p>
                                    <p className="text-xs text-muted-foreground">Performance detalhada</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Badge variant={isHighPerf ? 'default' : isMidPerf ? 'secondary' : 'destructive'} className="text-xs h-6 px-2 font-bold shadow-sm">
                            {data.aderencia.toFixed(1)}%
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span>Progresso</span>
                                <span className={statusColor}>{Math.min(data.aderencia, 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full ${barColor} rounded-full shadow-sm transition-all duration-1000 relative`}
                                    style={{ width: `${Math.min(data.aderencia, 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm shadow-sm group-hover:bg-white/80 dark:group-hover:bg-slate-800/80 transition-colors">
                                <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Meta</span>
                                </div>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm block truncate">
                                    {formatarHorasParaHMS(data.horasAEntregar)}
                                </span>
                            </div>

                            <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm shadow-sm group-hover:bg-white/80 dark:group-hover:bg-slate-800/80 transition-colors">
                                <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Real</span>
                                </div>
                                <span className={`font-mono font-bold text-sm block truncate ${statusColor}`}>
                                    {formatarHorasParaHMS(data.horasEntregues)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
};
