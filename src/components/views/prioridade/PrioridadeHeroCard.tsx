import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

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
    icon: LucideIcon;
    colorFrom: string;
    colorTo: string;
    iconColor: string;
    isPercentage?: boolean
}) => (
    <Card className="relative overflow-hidden rounded-[1.65rem] border border-slate-200/50 bg-white/90 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.25)] hover:border-slate-350 dark:border-slate-900/60 dark:bg-slate-900/40 dark:hover:border-slate-800 group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500`} />

        <div className="absolute -right-6 -bottom-6 opacity-[0.04] transform rotate-12 group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-700">
            <Icon className={`w-32 h-32 ${iconColor}`} />
        </div>

        <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-105 transition-transform duration-300 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
                <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-mono">
                    {value}
                </div>
                {isPercentage && (
                    <div className="mt-2.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-current rounded-full ${iconColor}`}
                            style={{ width: value }}
                        />
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);
