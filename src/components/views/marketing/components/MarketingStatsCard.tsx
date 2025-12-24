
import React from 'react';
import { getPremiumStyles } from './MarketingStatsTheme';

interface MarketingStatsCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    colorTheme: 'emerald' | 'rose' | 'indigo' | 'amber' | 'orange';
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
    footerText
}) => {
    const styles = getPremiumStyles(colorTheme);

    return (
        <div className={`group relative overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${styles.bg}`}>
            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
                <div className="w-24 h-24">{icon}</div>
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</span>
                        <div className={`p-2 rounded-xl ${styles.iconBg} transition-shadow duration-300 group-hover:shadow-md`}>
                            {/* We clone the icon to enforce size if needed, or just wrap it */}
                            <div className={`h-4 w-4 ${styles.text} flex items-center justify-center`}>
                                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' }) : icon}
                            </div>
                        </div>
                    </div>

                    <div className="mb-2">
                        <h3 className={`text-2xl font-bold tracking-tight font-mono ${styles.text}`}>{value}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium opacity-80">{subtitle}</p>
                    </div>
                </div>

                {(breakdown || footerText) && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                        {breakdown ? (
                            <div className="space-y-2">
                                {breakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center text-slate-600 dark:text-slate-400">
                                            {item.icon && <span className="mr-1.5 opacity-70">{item.icon}</span>}
                                            <span>{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value}</span>
                                            {item.percent && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles.iconBg} ${styles.text}`}>
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
