import React from 'react';
import { getPremiumStyles } from './MarketingStatsTheme';

interface MarketingStatsCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    colorTheme: 'emerald' | 'rose' | 'amber' | 'orange' | 'blue';
    breakdown?: {
        label: string;
        value: number | string;
        percent?: string;
        icon?: React.ReactNode;
    }[];
    footerText?: string;
}

export const MarketingStatsCard: React.FC<MarketingStatsCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    colorTheme,
    breakdown,
    footerText,
}) => {
    const styles = getPremiumStyles(colorTheme);

    return (
        <div className={`group relative overflow-hidden rounded-2xl border-none p-6 shadow-sm transition-all duration-300 hover:shadow-lg ${styles.bg}`}>
            <div className="pointer-events-none absolute top-0 right-0 p-3 opacity-10 transition-opacity duration-300 group-hover:scale-110 group-hover:opacity-20">
                <div className="h-24 w-24">{icon}</div>
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</span>
                        <div className={`rounded-xl p-2 transition-shadow duration-300 group-hover:shadow-md ${styles.iconBg}`}>
                            <div className={`flex h-4 w-4 items-center justify-center ${styles.text}`}>
                                {React.isValidElement(icon)
                                    ? React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })
                                    : icon}
                            </div>
                        </div>
                    </div>

                    <div className="mb-2">
                        <h3 className={`font-mono text-2xl font-bold tracking-tight ${styles.text}`}>{value}</h3>
                        <p className="text-xs font-medium text-slate-500 opacity-80 dark:text-slate-400">{subtitle}</p>
                    </div>
                </div>

                {(breakdown || footerText) && (
                    <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
                        {breakdown ? (
                            <div className="space-y-2">
                                {breakdown.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center text-slate-600 dark:text-slate-400">
                                            {item.icon && <span className="mr-1.5 opacity-70">{item.icon}</span>}
                                            <span>{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value}</span>
                                            {item.percent && (
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles.iconBg} ${styles.text}`}>
                                                    {item.percent}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{footerText}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
