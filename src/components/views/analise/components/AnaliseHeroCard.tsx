import React from 'react';
import { metricColors, MetricAccentColor } from './metricColors';

interface AnaliseHeroCardProps {
    title: string; value: string; icon: any; accentColor: MetricAccentColor; progress?: { value: number; label: string };
}

export const AnaliseHeroCard: React.FC<AnaliseHeroCardProps> = ({ title, value, icon: Icon, accentColor, progress }) => {
    const c = metricColors[accentColor];
    return (
        <div className={`group relative rounded-xl p-5 overflow-hidden transition-all duration-300 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg dark:hover:shadow-2xl ${c.glowBorder}`}>
            <div className="flex justify-between items-start mb-4"><div className={`p-2.5 rounded-xl ${c.iconBg}`}><Icon className={`w-5 h-5 ${c.iconText}`} /></div></div>
            <div className={progress ? 'space-y-1 mb-4' : 'space-y-1'}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p><p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
            </div>
            {progress && (
                <div className="space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                        <div className={`bg-gradient-to-r ${c.barFrom} ${c.barTo} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(progress.value, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium"><span className="text-slate-400 dark:text-slate-500">{progress.label}</span><span className={c.rateText}>{progress.value.toFixed(1)}%</span></div>
                </div>
            )}
        </div>
    );
};
