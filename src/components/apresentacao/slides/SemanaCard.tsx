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
    const fontSize = semana.aderencia >= 100 ? '2rem' : '2.5rem';

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Week label */}
            <div className="bg-slate-100 border border-slate-200 rounded-full px-8 py-2.5 shadow-sm">
                <h3 className="text-xl font-bold uppercase tracking-wide text-slate-800 text-center">
                    Semana {semana.numeroSemana}
                </h3>
            </div>

            {/* Progress circle - larger size */}
            <div className="relative w-[200px] h-[200px]">
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
                        strokeWidth="14"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="url(#progressGradientCard)"
                        strokeWidth="14"
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
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-2">
                        Aderência
                    </span>
                </div>
            </div>

            {/* Stats cards - wider */}
            <div className="w-[240px] space-y-3">
                {/* Planned hours */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-200 px-5 py-3 flex flex-col items-center shadow-sm">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                        Planejado
                    </span>
                    <span
                        className="font-bold text-blue-700"
                        style={buildTimeTextStyle(semana.horasPlanejadas, 1.375)}
                    >
                        {semana.horasPlanejadas}
                    </span>
                </div>

                {/* Delivered hours */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 px-5 py-3 flex flex-col items-center shadow-sm">
                    <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                        Entregue
                    </span>
                    <span
                        className="font-bold text-emerald-700"
                        style={buildTimeTextStyle(semana.horasEntregues, 1.25)}
                    >
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
