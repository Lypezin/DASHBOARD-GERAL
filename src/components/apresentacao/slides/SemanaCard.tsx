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
    isHighlighted?: boolean;
}

const buildCircleDasharray = (valor: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * 80;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const SemanaCard: React.FC<SemanaCardProps> = ({ semana, isHighlighted = false }) => {
    const adherenceText = semana.aderencia.toFixed(1);
    const fontSize = semana.aderencia >= 100 ? '2rem' : '2.5rem';

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Week label */}
            <div className={`rounded-full px-8 py-3 shadow-md ${isHighlighted ? 'bg-blue-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800'}`}>
                <h3 className="text-2xl font-bold uppercase tracking-wide text-center">
                    Semana {semana.numeroSemana}
                </h3>
            </div>

            {/* Progress circle - large and prominent */}
            <div className="relative w-[220px] h-[220px] animate-scale-in">
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 180 180"
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    {/* Background circle */}
                    <circle
                        cx="90"
                        cy="90"
                        r="80"
                        stroke="#e2e8f0"
                        strokeWidth="14"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="90"
                        cy="90"
                        r="80"
                        stroke={isHighlighted ? "#2563eb" : "#64748b"}
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Centered text container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-slate-900 font-black leading-none tracking-tight"
                        style={{ fontSize }}
                    >
                        {adherenceText}%
                    </span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="w-[260px] space-y-3">
                {/* Planned hours */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-200 px-5 py-3 flex flex-col items-center shadow-sm">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                        Planejado
                    </span>
                    <span
                        className="font-bold text-blue-700"
                        style={buildTimeTextStyle(semana.horasPlanejadas, 1.5)}
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
                        style={buildTimeTextStyle(semana.horasEntregues, 1.4)}
                    >
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
