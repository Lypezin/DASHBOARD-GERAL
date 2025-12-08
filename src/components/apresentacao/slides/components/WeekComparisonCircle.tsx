import React from 'react';
import { buildTimeTextStyle } from '@/components/apresentacao/utils';

interface WeekComparisonCircleProps {
    aderencia: number;
    horasEntregues: string;
    label: string;
    isSecond: boolean;
    size?: 'normal' | 'large';
    circleSizePx?: number; // Optional override
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
    circleSizePx
}) => {
    // Default sizes if no override provided
    const defaultSize = size === 'large' ? 110 : 90;
    const dimension = circleSizePx || defaultSize;
    const fontSizeClass = size === 'large' ? 'text-2xl' : 'text-xl';

    return (
        <div className="flex flex-col items-center gap-2">
            <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${isSecond ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {label}
            </span>

            {/* Progress Circle */}
            <div className="relative" style={{ width: dimension, height: dimension }}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={isSecond ? "#2563eb" : "#64748b"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(aderencia, 40)}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-slate-900 font-black ${fontSizeClass} leading-none`}>
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
