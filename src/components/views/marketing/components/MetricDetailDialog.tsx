
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
import { Eye, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';
import { MetricDetailList } from './MetricDetailList';

interface MetricDetailDialogProps {
    type: 'entradas' | 'saidas' | 'retomada';
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
    const isRetomada = type === 'retomada';

    let colorClass = isEntrada ? 'text-emerald-600' : 'text-rose-600';
    let hoverBgClass = isEntrada ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-rose-50 dark:hover:bg-rose-900/20';
    let Icon = isEntrada ? ArrowUpRight : ArrowDownRight;
    let titleText = isEntrada ? 'Entradas' : 'Saídas';
    let descriptionText = isEntrada ? 'entregadores ativos nesta semana.' : 'entregadores inativos nesta semana.';

    if (isRetomada) {
        colorClass = 'text-indigo-600';
        hoverBgClass = 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20';
        Icon = RotateCcw;
        titleText = 'Retomada';
        descriptionText = 'entregadores que retornaram à base nesta semana.';
    }

    const hasNoRecords = !marketingNames.length && !operacionalNames.length && !marketingNovosNames.length && !operacionalNovosNames.length;
    const hasNovos = marketingNovosNames.length > 0 || operacionalNovosNames.length > 0;

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
                        {titleText} - {weekLabel}
                    </DialogTitle>
                    <DialogDescription>
                        {count} {descriptionText}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="space-y-4">
                        {hasNoRecords && (
                            <div className="text-sm text-slate-500 text-center py-4">Nenhum registro.</div>
                        )}

                        <MetricDetailList
                            title="Marketing"
                            items={marketingNames}
                            type="marketing"
                            isEntrada={isEntrada}
                        />

                        <MetricDetailList
                            title="Operacional"
                            items={operacionalNames}
                            type="operacional"
                            isEntrada={isEntrada}
                        />

                        {/* Desistencias area */}
                        {hasNovos && (
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                    Desistências (Novos - não maturados)
                                </h4>

                                <div className="space-y-4">
                                    <MetricDetailList
                                        title="Marketing"
                                        items={marketingNovosNames}
                                        type="marketing-novos"
                                        isEntrada={isEntrada}
                                    />
                                    <MetricDetailList
                                        title="Operacional"
                                        items={operacionalNovosNames}
                                        type="operacional-novos"
                                        isEntrada={isEntrada}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
