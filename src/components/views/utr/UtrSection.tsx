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
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</CardTitle>
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
                                className="group relative rounded-xl border border-transparent bg-white dark:bg-slate-950 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 ring-1 ring-slate-200/50 dark:ring-slate-800"
                            >
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2 text-sm leading-tight" title={label}>
                                            {label || 'N/D'}
                                        </h3>
                                        <div className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold font-mono">
                                            {item.utr.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50">
                                            <Timer className="h-3 w-3 text-orange-500" />
                                            <span>{((item.tempo_horas ?? 0)).toFixed(1)}h</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 justify-end p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50">
                                            <Car className="h-3 w-3 text-emerald-500" />
                                            <span>{item.corridas}</span>
                                        </div>
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
