import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricDetailDialogProps {
    type: 'entradas' | 'saidas';
    weekLabel: string;
    count: number;
    marketingNames?: string[];
    operacionalNames?: string[];
    marketingNovosNames?: string[];
    operacionalNovosNames?: string[];
}

export const MetricDetailDialog: React.FC<MetricDetailDialogProps> = ({
    type,
    weekLabel,
    count,
    marketingNames = [],
    operacionalNames = [],
    marketingNovosNames = [],
    operacionalNovosNames = []
}) => {
    const isEntrada = type === 'entradas';
    const colorClass = isEntrada ? 'text-emerald-600' : 'text-rose-600';
    const hoverBgClass = isEntrada ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-rose-50 dark:hover:bg-rose-900/20';
    const Icon = isEntrada ? ArrowUpRight : ArrowDownRight;

    // Dot colors for lists
    const mktDot = isEntrada ? 'bg-emerald-500' : 'bg-rose-500';
    const opsDot = isEntrada ? 'bg-emerald-300' : 'bg-rose-300';

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${colorClass} hover:${colorClass.replace('text-', '')} ${hoverBgClass}`}
                >
                    <Eye className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                        {isEntrada ? 'Entradas' : 'Saídas'} - {weekLabel}
                    </DialogTitle>
                    <DialogDescription>
                        {count} entregadores {isEntrada ? 'ativos' : 'inativos'} nesta semana.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="space-y-4">
                        {(!marketingNames.length && !operacionalNames.length && !marketingNovosNames.length && !operacionalNovosNames.length) && (
                            <div className="text-sm text-slate-500 text-center py-4">Nenhum registro.</div>
                        )}

                        {marketingNames.length > 0 && (
                            <div>
                                <h4 className={`text-xs font-bold uppercase ${colorClass} dark:text-${isEntrada ? 'emerald' : 'rose'}-400 mb-2 flex items-center gap-1.5`}>
                                    <div className={`h-1.5 w-1.5 rounded-full ${mktDot}`}></div>
                                    Marketing ({marketingNames.length})
                                </h4>
                                <ul className="space-y-1.5">
                                    {marketingNames.map((nome, idx) => (
                                        <li key={`mkt-${idx}`} className={`flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-${isEntrada ? 'emerald' : 'rose'}-100 dark:border-${isEntrada ? 'emerald' : 'rose'}-900/30`}>
                                            <span className="truncate">{nome}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {operacionalNames.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${opsDot}`}></div>
                                    Operacional ({operacionalNames.length})
                                </h4>
                                <ul className="space-y-1.5">
                                    {operacionalNames.map((nome, idx) => (
                                        <li key={`ops-${idx}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-1.5 px-3 rounded-md bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                            <span className="truncate">{nome}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Desistencias area (only present if lists are not empty) */}
                        {(marketingNovosNames.length > 0 || operacionalNovosNames.length > 0) && (
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                    Desistências (Novos - não maturados)
                                </h4>

                                <div className="space-y-4">
                                    {marketingNovosNames.length > 0 && (
                                        <div>
                                            <h5 className="text-[10px] uppercase font-semibold text-rose-600/70 mb-2 ml-1">Marketing ({marketingNovosNames.length})</h5>
                                            <ul className="space-y-1.5">
                                                {marketingNovosNames.map((nome, idx) => (
                                                    <li key={`mkt-nov-${idx}`} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-md bg-amber-50 dark:bg-amber-900/10 shadow-sm border border-amber-100 dark:border-amber-900/30">
                                                        <span className="truncate">{nome}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {operacionalNovosNames.length > 0 && (
                                        <div>
                                            <h5 className="text-[10px] uppercase font-semibold text-slate-500/70 mb-2 ml-1">Operacional ({operacionalNovosNames.length})</h5>
                                            <ul className="space-y-1.5">
                                                {operacionalNovosNames.map((nome, idx) => (
                                                    <li key={`ops-nov-${idx}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 py-1.5 px-3 rounded-md bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed">
                                                        <span className="truncate">{nome}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
