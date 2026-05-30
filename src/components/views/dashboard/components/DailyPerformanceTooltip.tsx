import React from 'react';
import { TooltipContent } from "@/components/ui/tooltip";
import { AderenciaDia } from '@/types';

interface DailyPerformanceTooltipProps {
    dia: AderenciaDia;
}

export const DailyPerformanceTooltip: React.FC<DailyPerformanceTooltipProps> = ({ dia }) => {
    return (
        <TooltipContent side="top" className="border-slate-800 bg-slate-900 p-3 text-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-2">
                <p className="mb-2 border-b border-slate-700 pb-1 text-xs font-semibold text-slate-400">Metricas de Corrida</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Ofertadas:</span>
                        <span className="font-mono font-bold">{dia.corridas_ofertadas || 0}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-emerald-400">Aceitas:</span>
                        <span className="font-mono font-bold">{dia.corridas_aceitas || 0}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-blue-400">Completadas:</span>
                        <span className="font-mono font-bold">{dia.corridas_completadas || 0}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-rose-400">Rejeitadas:</span>
                        <span className="font-mono font-bold">{dia.corridas_rejeitadas || 0}</span>
                    </div>
                </div>
            </div>
        </TooltipContent>
    );
};
