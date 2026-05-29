import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const PrioridadeHeroCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    colorFrom,
    colorTo,
    iconColor,
    isPercentage = false
}: {
    title: string;
    value: string;
    subtext: string;
    icon: any;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
    isPercentage?: boolean
}) => (
    <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-[0.08] group-hover:opacity-[0.12] transition-opacity duration-500`} />

        <div className="absolute -right-6 -bottom-6 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
            <Icon className={`w-32 h-32 ${iconColor}`} />
        </div>

        <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
                <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
                    {value}
                </div>
                {isPercentage && (
                    <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-current ${iconColor}`}
                            style={{ width: value }}
                        />
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);
