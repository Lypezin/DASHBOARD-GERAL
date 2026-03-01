
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
import { DesistenciasList } from './DesistenciasList';

interface MetricDetailDialogProps {
    type: 'entradas' | 'saidas' | 'retomada';
    weekLabel: string;
    count: number;
    marketingNames?: string[];
    operacionalNames?: string[];
    marketingNovosNames?: string[];
    operacionalNovosNames?: string[];
}

import { getMetricDialogConfig } from '../utils/getMetricDialogConfig';

export const MetricDetailDialog: React.FC<MetricDetailDialogProps> = ({
    type,
    weekLabel,
    count,
    marketingNames = [],
    operacionalNames = [],
    marketingNovosNames = [],
    operacionalNovosNames = []
}) => {
    const { colorClass, hoverBgClass, Icon, titleText, descriptionText, isEntrada } = getMetricDialogConfig(type);

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
            <DialogContent className="max-w-md p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-5 pb-3">
                    <DialogTitle className={`flex items-center gap-2 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                        {titleText} - {weekLabel}
                    </DialogTitle>
                    <DialogDescription>
                        {count} {descriptionText}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] w-full px-5 pb-4">
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

                        {hasNovos && (
                            <DesistenciasList
                                marketingNovosNames={marketingNovosNames}
                                operacionalNovosNames={operacionalNovosNames}
                                isEntrada={isEntrada}
                            />
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
