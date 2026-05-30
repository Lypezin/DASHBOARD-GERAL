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
import { cn } from '@/lib/utils';

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
        isMidPerf ? 'text-primary dark:text-blue-400' :
            'text-rose-600 dark:text-rose-400';

    const barColor = isHighPerf ? 'bg-emerald-500' :
        isMidPerf ? 'bg-primary' :
            'bg-rose-500';

    // Barra lateral de status cirúrgica (substitui gradientes de fundo inteiros)
    const statusSideBarColor = isHighPerf ? 'bg-emerald-500' :
        isMidPerf ? 'bg-primary' :
            'bg-rose-500';

    const Icon = isMidPerf ? TrendingUp : TrendingDown;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Card className={cn(
                    "group relative cursor-help overflow-hidden border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200",
                    "hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_6px_14px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
                )}>
                    {/* Barra lateral sutil e cirúrgica de status */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", statusSideBarColor)} />

                    {/* Pequena marca d'água de ícone ao fundo */}
                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none text-foreground">
                        <Icon className="w-24 h-24 transform -rotate-12" />
                    </div>

                    <CardContent className="py-5 pl-6 pr-5 relative z-10">
                        {/* Cabeçalho */}
                        <div className="flex justify-between items-start mb-4 gap-2">
                            <div className="flex items-center gap-2 max-w-[70%] min-w-0">
                                <h3 className="font-bold text-base text-foreground truncate tracking-tight" title={data.label}>
                                    {data.label}
                                </h3>
                            </div>
                            <Badge 
                                variant="outline" 
                                className={cn(
                                    "text-xs h-6 px-2 font-bold transition-all shadow-none border-none",
                                    isHighPerf 
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                      : isMidPerf 
                                      ? "bg-primary/10 text-primary dark:text-blue-400" 
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                )}
                            >
                                {data.aderencia.toFixed(1)}%
                            </Badge>
                        </div>

                        {/* Conteúdo e Progress Bar */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold text-muted-foreground/80">
                                    <span>Progresso</span>
                                    <span className={statusColor}>{Math.min(data.aderencia, 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-700", barColor)}
                                        style={{ width: `${Math.min(data.aderencia, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <OperationalDetailMetrics
                                horasAEntregar={data.horasAEntregar}
                                horasEntregues={data.horasEntregues}
                                statusColor={statusColor}
                            />

                            {/* Mostrar corridas no rodapé como na Evolução Diária */}
                            {data.metrics && (
                                <div className="pt-3 mt-3 border-t border-border/40 w-full flex justify-between px-2">
                                     <div className="flex flex-col items-center min-w-0">
                                        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-bold truncate">
                                          Ofertadas
                                        </span>
                                        <span className="text-xs font-bold text-foreground font-mono mt-0.5">
                                          {data.metrics.ofertadas?.toLocaleString('pt-BR') || 0}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-center min-w-0">
                                        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-bold truncate">
                                          Completas
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                          {data.metrics.completadas?.toLocaleString('pt-BR') || 0}
                                        </span>
                                      </div>
                                </div>
                            )}
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
