import React from 'react';
import { buildTimeTextStyle } from '@/components/apresentacao/utils';

export interface DiaSemanaResumo {
    nome: string;
    sigla: string;
    aderencia: number;
    horasEntregues: string;
}

interface ComponentDayCardProps {
    dia: DiaSemanaResumo;
    isSecondWeek?: boolean;
    variacao?: {
        horas: string;
        horasPositiva: boolean;
        percentual: string;
        percentualPositiva: boolean;
    };
    isActive?: boolean;
}

const buildCircleDasharray = (valor: number, radius: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * radius;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

import { useAnimatedProgress } from '@/hooks/ui/useAnimatedProgress';

export const DayCard: React.FC<ComponentDayCardProps> = ({ dia, isSecondWeek = false, variacao, isActive = true }) => {
    // Animate adherence
    const animatedAderencia = useAnimatedProgress(dia.aderencia, 1000, Math.random() * 300, isActive);

    return (
        <div className={`rounded-lg border px-1 py-2 flex flex-col items-center gap-1.5 ${isSecondWeek ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200' : 'bg-gradient-to-b from-slate-50 to-white border-slate-200'}`}>
            {/* Day label */}
            <span className={`text-xs font-bold uppercase tracking-wider ${isSecondWeek ? 'text-blue-700' : 'text-slate-700'}`}>
                {dia.sigla}
            </span>

            {/* Progress circle */}
            <div className="relative w-[55px] h-[55px] animate-scale-in">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={isSecondWeek ? "#2563eb" : "#64748b"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(animatedAderencia, 40)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-slate-900 font-black leading-none tracking-tighter ${dia.aderencia >= 100 ? 'text-[0.5rem]' : 'text-[0.6rem]'}`}>
                        {dia.aderencia.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Hours delivered */}
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded px-0.5 py-1 text-center">
                <span className="text-[0.5rem] font-semibold text-emerald-600 uppercase block">Entregue</span>
                <span className="font-bold text-emerald-700 text-xs block" style={buildTimeTextStyle(dia.horasEntregues, 0.65)}>
                    {dia.horasEntregues}
                </span>
            </div>

            {/* Variation (only for second week) */}
            {variacao && (
                <div className={`w-full rounded px-1.5 py-1 text-center ${variacao.horasPositiva ? 'bg-emerald-100 border border-emerald-300' : 'bg-rose-100 border border-rose-300'}`}>
                    <div className={`flex items-center justify-center gap-0.5 font-bold text-[0.65rem] ${variacao.horasPositiva ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {variacao.horasPositiva ? (
                            <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4l-8 8h5v8h6v-8h5z" />
                            </svg>
                        ) : (
                            <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 20l8-8h-5V4H9v8H4z" />
                            </svg>
                        )}
                        <span style={buildTimeTextStyle(variacao.horas, 0.6)}>{variacao.horas}</span>
                    </div>
                    <span className={`text-[0.5rem] font-semibold ${variacao.percentualPositiva ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {variacao.percentual}
                    </span>
                </div>
            )}
        </div>
    );
};
