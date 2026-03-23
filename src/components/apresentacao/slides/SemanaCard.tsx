import React from 'react';
import { buildTimeTextStyle } from '../utils';

interface SemanaResumo { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string; }

import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';

interface SemanaCardProps { semana: SemanaResumo; isHighlighted?: boolean; isActive?: boolean; }

const buildCircleDasharray = (valor: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * 80;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const SemanaCard: React.FC<SemanaCardProps> = ({ semana, isHighlighted = false, isActive = true }) => {
    const animatedAderencia = useAnimatedProgress(semana.aderencia, 1500, 200, isActive);
    const adherenceText = semana.aderencia.toFixed(2);
    const fontSize = semana.aderencia >= 100 ? '1.75rem' : '2.25rem';

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Week label */}
            <div className={`rounded-full px-10 py-3.5 shadow-md ${isHighlighted ? 'bg-blue-600 dark:bg-blue-700 text-white animate-glow-pulse' : 'bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800/50 text-sky-800 dark:text-sky-300'}`}>
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
                    <circle cx="90" cy="90" r="80" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="14" fill="none" />
                    <circle cx="90" cy="90" r="80" stroke={isHighlighted ? "#2563eb" : "#38bdf8"} strokeWidth="14" fill="none" strokeDasharray={buildCircleDasharray(animatedAderencia)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>

                {/* Centered text container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-slate-900 dark:text-slate-100 font-black leading-none tracking-tight"
                        style={{ fontSize }}
                    >
                        {adherenceText}%
                    </span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="w-[280px] space-y-3">
                {/* Planned hours */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/30 dark:to-slate-800 border border-blue-200 dark:border-blue-800/50 px-5 py-3 flex flex-col items-center shadow-sm animate-float-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                    <span className="text-base font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Planejado
                    </span>
                    <span
                        className="font-bold text-blue-700 dark:text-blue-300"
                        style={buildTimeTextStyle(semana.horasPlanejadas, 1.7)}
                    >
                        {semana.horasPlanejadas}
                    </span>
                </div>

                {/* Delivered hours */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-800 border border-emerald-200 dark:border-emerald-800/50 px-5 py-3 flex flex-col items-center shadow-sm animate-float-up" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
                    <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Entregue
                    </span>
                    <span
                        className="font-bold text-emerald-700 dark:text-emerald-300"
                        style={buildTimeTextStyle(semana.horasEntregues, 1.6)}
                    >
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
