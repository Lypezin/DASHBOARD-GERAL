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

    // Font size: must fit "XX.XX%" (7 chars) inside circle
    // Normal circle ~95px → ~58px inner text area. text-xs (12px) fits.
    // Large circle ~110px → ~67px inner text area. text-sm (14px) fits.
    const fontSizeClass = size === 'large'
        ? (aderencia >= 100 ? 'text-xs' : 'text-sm')
        : 'text-xs';

    return (
        <div className="flex flex-col items-center gap-2.5">
            <span className={`text-sm font-bold px-4 py-1 rounded-full tracking-wide ${isSecond ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'}`}>
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
                        strokeDasharray={buildCircleDasharray(animatedAderencia, 34)}
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

            {/* Hours - Compact Row-by-Row Design */}
            {(horasPlanejadas || horasEntregues) && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl px-4 py-3 w-full mt-2 flex flex-col gap-2 min-w-[172px] max-w-[220px]">
                    {horasPlanejadas && (
                        <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                            <span className="shrink-0 font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Meta</span>
                            <span className="min-w-0 text-right font-black text-slate-800 dark:text-slate-200 leading-none tabular-nums" style={buildTimeTextStyle(horasPlanejadas, 1)}>{horasPlanejadas}</span>
                        </div>
                    )}
                    {horasPlanejadas && horasEntregues && (
                        <div className="h-px bg-slate-200/60 dark:bg-slate-700 w-full my-0.5" />
                    )}
                    {horasEntregues && (
                        <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                            <span className="shrink-0 font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Entregue</span>
                            <span className="min-w-0 text-right font-black text-emerald-600 dark:text-emerald-400 leading-none tabular-nums" style={buildTimeTextStyle(horasEntregues, 1)}>{horasEntregues}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
