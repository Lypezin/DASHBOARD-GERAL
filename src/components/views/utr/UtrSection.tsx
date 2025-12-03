import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UtrItemBase {
    tempo_horas: number;
    corridas: number;
    utr: number;
    [key: string]: any;
}

interface UtrSectionProps<T extends UtrItemBase> {
    title: string;
    description: string;
    icon: React.ReactNode;
    data: T[];
    getLabel: (item: T) => string;
    gridCols?: string;
}

export const UtrSection = React.memo(function UtrSection<T extends UtrItemBase>({
    title,
    description,
    icon,
    data,
    getLabel,
    gridCols = "md:grid-cols-2 lg:grid-cols-3"
}: UtrSectionProps<T>) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className={cn("grid grid-cols-1 gap-4", gridCols)}>
                    {data.map((item, index) => {
                        const label = getLabel(item);
                        return (
                            <div
                                key={`${label}-${index}`}
                                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2" title={label}>
                                        {label || 'N/D'}
                                    </h3>
                                    <div className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                                        {item.utr.toFixed(2)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Timer className="h-3 w-3" />
                                        <span>{((item.tempo_horas ?? 0)).toFixed(1)}h</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <Car className="h-3 w-3" />
                                        <span>{item.corridas}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
});
