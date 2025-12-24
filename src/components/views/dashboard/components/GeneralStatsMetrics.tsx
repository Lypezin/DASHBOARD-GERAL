
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, Clock, CheckCircle2, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface GeneralStatsMetricsProps {
    stats: {
        planejado: string | number;
        entregue: string | number;
        gap: string | null;
        statusColor: string;
    };
}

export const GeneralStatsMetrics: React.FC<GeneralStatsMetricsProps> = ({ stats }) => {
    return (
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Tempo Planejado */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 flex items-start justify-between relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tempo Planejado</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="text-slate-300 hover:text-blue-500 transition-colors focus:outline-none">
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Total de horas agendadas em escala.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <h4 className="text-4xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                            {stats.planejado}
                        </h4>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-100 dark:border-blue-900/50">
                                <ArrowUp className="w-3 h-3" />
                                <span>Meta</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardContent>
            </Card>

            {/* Tempo Entregue */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 flex items-start justify-between relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tempo Entregue</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="text-slate-300 hover:text-emerald-500 transition-colors focus:outline-none">
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Horas efetivamente trabalhadas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <h4 className={`text-4xl font-bold font-mono tracking-tight ${stats.statusColor}`}>
                            {stats.entregue}
                        </h4>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/50">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Realizado</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </CardContent>
            </Card>

            {/* Gap Indicator */}
            {stats.gap && (
                <Card className="md:col-span-2 border-none shadow-md bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                    <CardContent className="p-5 flex items-center gap-5">
                        <div className="p-3 bg-white dark:bg-rose-950/50 rounded-full shadow-sm border border-rose-100 dark:border-rose-900/50 ring-4 ring-rose-50 dark:ring-rose-900/20">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-bold text-rose-900 dark:text-rose-200">
                                Atenção: Gap de Entrega Detectado
                            </p>
                            <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">
                                Faltam <span className="font-bold font-mono text-base bg-rose-100 dark:bg-rose-900/50 px-1.5 rounded mx-1">{stats.gap}</span> para atingir a meta planejada da semana.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
