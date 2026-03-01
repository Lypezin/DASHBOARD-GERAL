import React from 'react';
import { TooltipContent } from "@/components/ui/tooltip";
import { AderenciaDia } from '@/types';

interface DailyPerformanceTooltipProps {
    dia: AderenciaDia;
}

export const DailyPerformanceTooltip: React.FC<DailyPerformanceTooltipProps> = ({ dia }) => {
    return (
        <TooltipContent side="top" className="p-3 bg-slate-900 text-slate-50 border-slate-800 dark:bg-slate-950 dark:border-slate-800">
            <div className="space-y-2">
                <p className="font-bold border-b border-slate-700 pb-1 mb-2 text-xs uppercase tracking-wider text-slate-400">Métricas de Corrida</p>
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
