import React from 'react';
import { buildTimeTextStyle } from '@/components/apresentacao/utils';
import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';

interface WeekComparisonCircleProps {
    aderencia: number;
    horasEntregues: string;
    horasPlanejadas?: string; // Newly added
    label: string;
    isSecond: boolean;
    size?: 'normal' | 'large';
    circleSizePx?: number; // Optional override
    isActive?: boolean;
}

const buildCircleDasharray = (valor: number, radius: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * radius;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const WeekComparisonCircle: React.FC<WeekComparisonCircleProps> = ({
    aderencia,
    horasEntregues,
    horasPlanejadas,
    label,
    isSecond,
    size = 'normal',
    circleSizePx,
    isActive = true
}) => {
    // Animate adherence
    const animatedAderencia = useAnimatedProgress(aderencia, 1000, 100, isActive);

    // Default sizes if no override provided
    const defaultSize = size === 'large' ? 130 : 105;
    const dimension = circleSizePx || defaultSize;

    // Font size logic to prevent overflow on 100%
    const fontSizeClass = size === 'large'
        ? (aderencia >= 100 ? 'text-lg' : 'text-xl')
        : (aderencia >= 100 ? 'text-base' : 'text-lg');

    return (
        <div className="flex flex-col items-center gap-2.5">
            <span className={`text-base font-bold px-5 py-1.5 rounded-full tracking-wide ${isSecond ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'}`}>
                {label}
            </span>

            {/* Progress Circle */}
            <div className="relative animate-scale-in" style={{ width: dimension, height: dimension }}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="34" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="7" fill="none" />
                    <circle
                        cx="50"
                        cy="50"
                        r="34"
                        stroke={isSecond ? "#2563eb" : "#38bdf8"}
                        strokeWidth="7"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(animatedAderencia, 40)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-slate-900 dark:text-slate-100 font-black ${fontSizeClass} leading-none tracking-tight`}>
                        {aderencia.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Hours */}
            <div className="flex flex-col gap-2 w-full mt-2">
                {horasPlanejadas && (
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-lg px-4 py-2.5 text-center min-w-[130px] animate-float-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase mb-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>Meta</span>
                        </div>
                        <span className="font-bold text-sky-700 dark:text-sky-300 block text-lg" style={buildTimeTextStyle(horasPlanejadas, 1.1)}>
                            {horasPlanejadas}
                        </span>
                    </div>
                )}
                {horasEntregues && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-4 py-2.5 text-center min-w-[130px] animate-float-up opacity-0" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>Real</span>
                        </div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-lg" style={buildTimeTextStyle(horasEntregues, 1.1)}>
                            {horasEntregues}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
