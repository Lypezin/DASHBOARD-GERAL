import React from 'react';
import { buildCircleTextStyle, buildTimeTextStyle } from '../utils';

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
    const circumference = 2 * Math.PI * 110;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const SemanaCard: React.FC<SemanaCardProps> = ({ semana }) => {
    return (
        <div className="flex flex-col items-center gap-4 flex-1">
            {/* Week label */}
            <div className="inline-block bg-slate-100 rounded-full px-6 py-2 shadow-sm">
                <h3 className="text-[1.375rem] font-bold uppercase tracking-wide text-slate-800">
                    Semana {semana.numeroSemana}
                </h3>
            </div>

            {/* Progress circle */}
            <div className="relative flex items-center justify-center" style={{ width: '180px', height: '180px' }}>
                {/* Background glow */}
                <div className="absolute inset-2 bg-blue-100 rounded-full blur-xl opacity-50" />

                <svg
                    className="absolute"
                    style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
                    viewBox="0 0 240 240"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background circle */}
                    <circle cx="120" cy="120" r="110" stroke="#e2e8f0" strokeWidth="14" fill="none" />
                    {/* Progress circle */}
                    <circle
                        cx="120"
                        cy="120"
                        r="110"
                        stroke="url(#progressGradient)"
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span
                        className="text-slate-900 font-black"
                        style={{
                            ...buildCircleTextStyle(semana.aderencia, 2.2, 1.2),
                            textShadow: 'none',
                        }}
                    >
                        {semana.aderencia.toFixed(1)}%
                    </span>
                    <span className="text-[0.75rem] font-medium text-slate-500 uppercase tracking-wide">
                        Aderência
                    </span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="w-full max-w-[260px] space-y-2">
                {/* Planned hours */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-200 px-4 py-2.5 flex flex-col items-center gap-1 shadow-sm">
                    <span className="text-[0.875rem] font-medium text-blue-600 uppercase tracking-wide">
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
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 px-4 py-2.5 flex flex-col items-center gap-1 shadow-sm">
                    <span className="text-[0.875rem] font-medium text-emerald-600 uppercase tracking-wide">
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
