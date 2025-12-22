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
    const theme = THEME_STYLES[colorTheme];

    return (
        <div className={`group relative overflow-hidden rounded-2xl p-1 shadow-lg ${theme.bg} ${theme.shadow}`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            <div className={`relative h-full rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between ${theme.innerBg}`}>
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="rounded-lg bg-white/20 p-2 text-white">
                            {icon}
                        </div>
                        <span className="text-xs font-bold text-white/90 uppercase tracking-wider">{title}</span>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                        <p className={`text-xs ${theme.subtitle}`}>{subtitle}</p>
                    </div>
                </div>

                {(breakdown || footerText) && (
                    <div className="pt-3 border-t border-white/10 mt-auto">
                        {breakdown ? (
                            <div className="space-y-3">
                                {breakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center text-white/90">
                                            {item.icon && <span className="mr-2 opacity-90">{item.icon}</span>}
                                            <span>{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{item.value}</span>
                                            {item.percent && (
                                                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/80">
                                                    {item.percent}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-white/70">{footerText}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
