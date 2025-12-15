import React from 'react';
import { buildTimeTextStyle } from '@/components/apresentacao/utils';
import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';

interface WeekComparisonCircleProps {
    aderencia: number;
    horasEntregues: string;
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
    label,
    isSecond,
    size = 'normal',
    circleSizePx,
    isActive = true
}) => {
    // Animate adherence
    const animatedAderencia = useAnimatedProgress(aderencia, 1000, 100, isActive);

    // Default sizes if no override provided
    const defaultSize = size === 'large' ? 110 : 90;
    const dimension = circleSizePx || defaultSize;

    // Font size logic to prevent overflow on 100%
    const fontSizeClass = size === 'large'
        ? (aderencia >= 100 ? 'text-lg' : 'text-xl')
        : (aderencia >= 100 ? 'text-base' : 'text-lg');

    return (
        <div className="flex flex-col items-center gap-2">
            <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${isSecond ? 'bg-blue-600 text-white' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
                {label}
            </span>

            {/* Progress Circle */}
            <div className="relative animate-scale-in" style={{ width: dimension, height: dimension }}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="34" stroke="#e2e8f0" strokeWidth="7" fill="none" />
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
                <div className="absolute inset-0 flex items-center justify-center pt-1">
                    <span className={`text-slate-900 font-black ${fontSizeClass} leading-none tracking-tight`}>
                        {aderencia.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Hours */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center min-w-[110px]">
                <span className="text-[0.6rem] font-semibold text-emerald-600 uppercase block">Entregue</span>
                <span className="font-bold text-emerald-700 block text-base" style={buildTimeTextStyle(horasEntregues, 1)}>
                    {horasEntregues}
                </span>
            </div>
        </div>
    );
};
