import React from 'react';

interface DailyCorridasMetricsProps {
    ofertadas?: number;
    completadas?: number;
}

export const DailyCorridasMetrics: React.FC<DailyCorridasMetricsProps> = ({ ofertadas, completadas }) => {
    return (
        <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Ofert</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                    {ofertadas || 0}
                </span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Comp</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {completadas || 0}
                </span>
            </div>
        </div>
    );
};
