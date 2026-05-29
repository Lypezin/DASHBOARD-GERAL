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
                    className="group/retomada -mx-2 -my-1 flex min-w-[80px] cursor-pointer flex-col items-center justify-center rounded-xl px-2 py-1 transition-all hover:bg-sky-50 dark:hover:bg-sky-950/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600/70 dark:text-sky-300/70">Retomada</span>
                    <div className="flex items-center gap-1.5">
                        <div className="rounded-full bg-sky-100 p-1 dark:bg-sky-900/30">
                            <RotateCcw className="h-3 w-3 text-sky-600 dark:text-sky-300" />
                        </div>
                        <span className="text-lg font-bold text-sky-700 tabular-nums dark:text-sky-300">{totalRetomada}</span>
                    </div>
                    <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-semibold text-sky-500 opacity-70 transition-opacity group-hover/retomada:opacity-100 dark:text-sky-300">
                        ver origens <ChevronDown className="-rotate-90 h-2.5 w-2.5" />
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-[380px] gap-0 rounded-2xl p-0">
                <div className="p-5 pb-3">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base text-sky-600 dark:text-sky-300">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40">
                                <RotateCcw className="h-4 w-4" />
                            </div>
                            Origem da retomada
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs">
                            {formatWeekLabel(item.semana)} - {totalRetomada} entregadores retornaram
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <ScrollArea className="max-h-[50vh] px-5">
                    <div className="space-y-1.5 pb-3">
                        {sortedOrigins.map(([week, count]: [string, any], idx) => {
                            const percent = Math.round((Number(count) / totalRetomada) * 100);
                            return (
                                <div key={week} className="relative overflow-hidden rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-xl bg-sky-100/50 dark:bg-sky-900/15"
                                        style={{ width: `${percent}%` }}
                                    />
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${idx === 0 ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                {formatWeekLabel(week)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-sky-700 tabular-nums dark:text-sky-300">
                                                {count}
                                            </span>
                                            <span className="w-8 text-right text-[10px] text-slate-400 tabular-nums">
                                                {percent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="flex items-center gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                    <Users className="h-3.5 w-3.5 text-sky-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Total: <b className="text-sky-600 dark:text-sky-300">{totalRetomada}</b> retornaram em {formatWeekLabel(item.semana)}
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
};
