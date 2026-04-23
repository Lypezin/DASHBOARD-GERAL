import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { OperationalDetailMetrics } from './OperationalDetailMetrics';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DetailData {
    label: string;
    aderencia: number;
    horasAEntregar: number | string;
    horasEntregues: number | string;
    metrics?: {
        ofertadas: number;
        aceitas: number;
        completadas: number;
        rejeitadas: number;
    };
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
        ? 'bg-gradient-to-br from-white/90 to-emerald-50/70 dark:from-slate-900/90 dark:to-emerald-900/20'
        : isMidPerf
            ? 'bg-gradient-to-br from-white/90 to-blue-50/70 dark:from-slate-900/90 dark:to-blue-900/20'
            : 'bg-gradient-to-br from-white/90 to-rose-50/70 dark:from-slate-900/90 dark:to-rose-900/20';

    const Icon = isMidPerf ? TrendingUp : TrendingDown;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Card className={`border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group ${bgGradient} backdrop-blur-xl cursor-help`}>
                    <div className={`absolute top-0 right-0 p-3 opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500 pointer-events-none`}>
                        <Icon className="w-28 h-28 text-current transform -rotate-12" />
                    </div>

                    <CardContent className="p-5 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 max-w-[70%]">
                                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate tracking-tight" title={data.label}>
                                    {data.label}
                                </h3>
                            </div>
                            <Badge variant={isHighPerf ? 'default' : isMidPerf ? 'secondary' : 'destructive'} className="text-xs h-6 px-2 font-bold shadow-sm">
                                {data.aderencia.toFixed(1)}%
                            </Badge>
                        </div>

                        <div className="space-y-4">
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

                            <OperationalDetailMetrics
                                horasAEntregar={data.horasAEntregar}
                                horasEntregues={data.horasEntregues}
                                statusColor={statusColor}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-3 bg-slate-900 text-slate-50 border-slate-800 dark:bg-slate-950 dark:border-slate-800">
                <div className="space-y-2">
                    <p className="font-bold border-b border-slate-700 pb-1 mb-2 text-xs uppercase tracking-wider text-slate-400">Métricas de Corrida</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex justify-between gap-2"><span className="text-slate-400">Ofertadas:</span><span className="font-mono font-bold">{data.metrics?.ofertadas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-emerald-400">Aceitas:</span><span className="font-mono font-bold">{data.metrics?.aceitas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-blue-400">Completadas:</span><span className="font-mono font-bold">{data.metrics?.completadas || 0}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-rose-400">Rejeitadas:</span><span className="font-mono font-bold">{data.metrics?.rejeitadas || 0}</span></div>
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};
