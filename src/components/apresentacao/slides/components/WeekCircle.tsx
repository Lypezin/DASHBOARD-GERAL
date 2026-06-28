import React from 'react';
import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';
import { buildTimeTextStyle } from '../../utils';

const buildCircleDasharray = (valor: number, radius: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * radius;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

interface TurnoResumo {
    aderencia: number;
    horasEntregues: string;
    horasPlanejadas?: string;
}

interface WeekCircleProps {
    semana: TurnoResumo;
    label: string;
    isSecond: boolean;
    size?: 'normal' | 'large';
    isActive?: boolean;
}

export const WeekCircle: React.FC<WeekCircleProps> = ({
    semana,
    label,
    isSecond,
    size = 'normal',
    isActive = true
}) => {
    const circleSize = size === 'large' ? 'w-[140px] h-[140px]' : 'w-[115px] h-[115px]';
    // 115px circle → ~70px inner. text-sm (14px) × 7 chars ≈ 60px fits.
    const fontSize = size === 'large' ? 'text-base' : 'text-sm';

    // Animate adherence
    const animatedAderencia = useAnimatedProgress(semana.aderencia, 1000, 100, isActive);

    return (
        <div className="flex flex-col items-center gap-3">
            <span className={`text-sm font-bold px-4 py-1.5 rounded-full tracking-wide ${isSecond ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800'}`}>
                {label}
            </span>

            {/* Progress Circle */}
            <div className={`relative ${circleSize} animate-scale-in ${isActive ? 'animate-pulse-scale delay-500' : ''}`}>
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
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-slate-900 dark:text-slate-100 font-black ${fontSize} leading-none tracking-tight`}>
                        {semana.aderencia.toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Hours - Compact Row-by-Row Design */}
            {(semana.horasPlanejadas || semana.horasEntregues) && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl px-2.5 py-1.5 w-full mt-2 flex flex-col gap-1 min-w-[125px]">
                    {semana.horasPlanejadas && (
                        <div className="flex justify-between items-center text-[10px] sm:text-xs">
                            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[8px] sm:text-[9px]">Meta</span>
                            <span className="font-extrabold text-slate-700 dark:text-slate-350 leading-none">{semana.horasPlanejadas}</span>
                        </div>
                    )}
                    {semana.horasPlanejadas && semana.horasEntregues && (
                        <div className="h-px bg-slate-200/60 dark:bg-slate-700 w-full my-0.5" />
                    )}
                    {semana.horasEntregues && (
                        <div className="flex justify-between items-center text-[10px] sm:text-xs">
                            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[8px] sm:text-[9px]">Real</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">{semana.horasEntregues}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
