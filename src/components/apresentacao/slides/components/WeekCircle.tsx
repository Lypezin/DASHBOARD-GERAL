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
                        strokeDasharray={buildCircleDasharray(animatedAderencia, 40)}
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

            {/* Hours */}
            <div className="flex flex-col gap-2 w-full mt-1">
                {semana.horasPlanejadas && (
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-lg px-4 py-1.5 text-center min-w-[120px] animate-float-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase mb-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>Meta</span>
                        </div>
                        <span className="font-bold text-sky-700 dark:text-sky-300 block text-base" style={buildTimeTextStyle(semana.horasPlanejadas, 1)}>
                            {semana.horasPlanejadas}
                        </span>
                    </div>
                )}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-4 py-1.5 text-center min-w-[120px] animate-float-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>Real</span>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-base" style={buildTimeTextStyle(semana.horasEntregues, 1)}>
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
