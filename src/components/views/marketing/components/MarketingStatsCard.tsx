import React from 'react';

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

const THEME_STYLES = {
    emerald: {
        bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        shadow: 'shadow-emerald-500/20',
        innerBg: 'bg-gradient-to-br from-emerald-500/90 to-emerald-600/90',
        subtitle: 'text-emerald-100'
    },
    rose: {
        bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
        shadow: 'shadow-rose-500/20',
        innerBg: 'bg-gradient-to-br from-rose-500/90 to-rose-600/90',
        subtitle: 'text-rose-100'
    },
    indigo: {
        bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        shadow: 'shadow-indigo-500/20',
        innerBg: 'bg-transparent', // Often handled by parent or simple gradient
        subtitle: 'text-white/70'
    },
    amber: {
        bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
        shadow: 'shadow-amber-500/20',
        innerBg: 'bg-transparent',
        subtitle: 'text-white/70'
    },
    orange: {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
        shadow: 'shadow-orange-500/20',
        innerBg: 'bg-gradient-to-br from-orange-400/90 to-orange-500/90',
        subtitle: 'text-orange-100'
    }
};

export const MarketingStatsCard: React.FC<MarketingStatsCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    colorTheme,
    breakdown,
    footerText
}) => {
    const theme = THEME_STYLES[colorTheme] || THEME_STYLES.indigo;

    // Mapping for light/premium styles (Adapting existing themes to the new light style)
    const getPremiumStyles = (themeName: string) => {
        switch (themeName) {
            case 'emerald': return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' };
            case 'rose': return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900', iconBg: 'bg-rose-100 dark:bg-rose-900/40' };
            case 'amber': return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900', iconBg: 'bg-amber-100 dark:bg-amber-900/40' };
            case 'orange': return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900', iconBg: 'bg-orange-100 dark:bg-orange-900/40' };
            case 'indigo': default: return { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' };
        }
    };

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
