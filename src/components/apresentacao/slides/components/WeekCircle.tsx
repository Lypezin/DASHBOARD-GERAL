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
    const circleSize = size === 'large' ? 'w-[120px] h-[120px]' : 'w-[100px] h-[100px]';
    const fontSize = size === 'large' ? 'text-xl' : 'text-base';

    // Animate adherence
    const animatedAderencia = useAnimatedProgress(semana.aderencia, 1000, 100, isActive);

    return (
        <div className="flex flex-col items-center gap-3">
            <span className={`text-sm font-bold px-5 py-1.5 rounded-full ${isSecond ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800'}`}>
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
                    <span className={`text-slate-900 dark:text-slate-100 font-black ${fontSize} leading-none tracking-tight`}>
                        {semana.aderencia.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Hours */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-4 py-2 text-center min-w-[120px]">
                <span className="text-[0.6rem] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">Entregue</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-lg" style={buildTimeTextStyle(semana.horasEntregues, 1)}>
                    {semana.horasEntregues}
                </span>
            </div>
        </div>
    );
};
