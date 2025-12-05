import React from 'react';
import { buildTimeTextStyle } from '../utils';

interface SemanaResumo {
    numeroSemana: string;
    aderencia: number;
    horasPlanejadas: string;
    horasEntregues: string;
}

interface SemanaCardProps {
    semana: SemanaResumo;
}

const buildCircleDasharray = (valor: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * 90;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const SemanaCard: React.FC<SemanaCardProps> = ({ semana }) => {
    // Format adherence value with proper sizing
    const adherenceText = semana.aderencia.toFixed(1);
    const fontSize = semana.aderencia >= 100 ? '1.75rem' : '2rem';

    return (
        <div className="flex flex-col items-center gap-4 flex-1 max-w-[280px]">
            {/* Week label */}
            <div className="bg-slate-100 rounded-full px-6 py-2 shadow-sm">
                <h3 className="text-lg font-bold uppercase tracking-wide text-slate-800 text-center">
                    Semana {semana.numeroSemana}
                </h3>
            </div>

            {/* Progress circle - fixed size container */}
            <div className="relative w-[160px] h-[160px] flex items-center justify-center">
                {/* SVG Progress ring */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 200 200"
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    {/* Background circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="url(#progressGradientCard)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="progressGradientCard" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Centered text container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-slate-900 font-black leading-none"
                        style={{ fontSize }}
                    >
                        {adherenceText}%
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                        Aderência
                    </span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="w-full space-y-2">
                {/* Planned hours */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-200 px-4 py-2.5 flex flex-col items-center shadow-sm">
                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                        Planejado
                    </span>
                    <span
                        className="font-bold text-blue-700"
                        style={buildTimeTextStyle(semana.horasPlanejadas, 1.25)}
                    >
                        {semana.horasPlanejadas}
                    </span>
                </div>

                {/* Delivered hours */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 px-4 py-2.5 flex flex-col items-center shadow-sm">
                    <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">
                        Entregue
                    </span>
                    <span
                        className="font-bold text-emerald-700"
                        style={buildTimeTextStyle(semana.horasEntregues, 1.125)}
                    >
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
