import React from 'react';
import { RotateCcw, ChevronDown, Users } from 'lucide-react';
import { formatWeekLabel } from '@/utils/timeHelpers';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
    item: any;
    totalRetomada: number;
    sortedOrigins: [string, unknown][];
}

export const EntradaSaidaRetomadaDialog: React.FC<Props> = ({ item, totalRetomada, sortedOrigins }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    className="flex flex-col items-center justify-center min-w-[80px] cursor-pointer group/retomada rounded-xl px-2 py-1 -mx-2 -my-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600/70 mb-0.5">Retomada</span>
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                            <RotateCcw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">{totalRetomada}</span>
                    </div>
                    <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400 mt-0.5 opacity-70 group-hover/retomada:opacity-100 transition-opacity flex items-center gap-0.5">
                        ver origens <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-[380px] p-0 gap-0 rounded-2xl">
                <div className="p-5 pb-3">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-indigo-600 text-base">
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                <RotateCcw className="h-4 w-4" />
                            </div>
                            Origem da Retomada
                        </DialogTitle>
                        <DialogDescription className="text-xs mt-1">
                            {formatWeekLabel(item.semana)} — {totalRetomada} entregadores retornaram
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <ScrollArea className="max-h-[50vh] px-5">
                    <div className="space-y-1.5 pb-3">
                        {sortedOrigins.map(([week, count]: [string, any], idx) => {
                            const percent = Math.round((Number(count) / totalRetomada) * 100);
                            return (
                                <div key={week} className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-indigo-100/50 dark:bg-indigo-900/15 rounded-xl"
                                        style={{ width: `${percent}%` }}
                                    />
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                {formatWeekLabel(week)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                                                {count}
                                            </span>
                                            <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">
                                                {percent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <b className="text-indigo-600 dark:text-indigo-400">{totalRetomada}</b> retornaram em {formatWeekLabel(item.semana)}
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
};
