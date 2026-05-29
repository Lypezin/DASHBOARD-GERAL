import React from 'react';
import { metricColors, MetricAccentColor } from './metricColors';
import { cn } from '@/lib/utils';

interface AnaliseHeroCardProps {
    title: string;
    value: string;
    icon: any;
    accentColor: MetricAccentColor;
    progress?: { value: number; label: string };
}

export const AnaliseHeroCard: React.FC<AnaliseHeroCardProps> = ({ title, value, icon: Icon, accentColor, progress }) => {
    const c = metricColors[accentColor];
    
    // Determinar classes base dinâmicas alinhadas com o novo design system
    let colorClass = 'text-primary';
    let bgIconClass = 'bg-primary/10 border-primary/20 text-primary';
    let progressFillClass = 'bg-primary';

    if (accentColor === 'emerald' || accentColor === 'sky') {
        colorClass = 'text-emerald-600 dark:text-emerald-400';
        bgIconClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
        progressFillClass = 'bg-emerald-500';
    } else if (accentColor === 'rose') {
        colorClass = 'text-rose-600 dark:text-rose-400';
        bgIconClass = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
        progressFillClass = 'bg-rose-500';
    } else if (accentColor === 'orange') {
        colorClass = 'text-amber-600 dark:text-amber-400';
        bgIconClass = 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
        progressFillClass = 'bg-amber-500';
    }

    return (
        <div className="group relative rounded-xl p-5 border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-start mb-4">
                {/* Ícone envolto em container suave */}
                <div className={cn("p-2.5 rounded-lg border shrink-0", bgIconClass)}>
                    <Icon className="w-4.5 h-4.5" />
                </div>
            </div>

            {/* Valores */}
            <div className={progress ? 'space-y-1 mb-4' : 'space-y-1'}>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    {title}
                </p>
                <p className="text-2xl font-black tracking-tight text-foreground font-outfit">
                    {value}
                </p>
            </div>

            {/* Barra de Progresso Fina */}
            {progress && (
                <div className="space-y-2">
                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div 
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out", progressFillClass)} 
                            style={{ width: `${Math.min(progress.value, 100)}%` }} 
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] sm:text-xs font-semibold">
                        <span className="text-muted-foreground/75 uppercase tracking-wide">
                            {progress.label}
                        </span>
                        <span className={colorClass}>
                            {progress.value.toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
