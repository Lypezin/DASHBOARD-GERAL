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
}

const buildCircleDasharray = (valor: number, radius: number) => {
    const clamped = Math.max(0, Math.min(100, valor));
    const circumference = 2 * Math.PI * radius;
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const DayCard: React.FC<ComponentDayCardProps> = ({ dia, isSecondWeek = false, variacao }) => (
    <div className={`rounded-xl border p-3 flex flex-col items-center gap-2 ${isSecondWeek ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200' : 'bg-gradient-to-b from-slate-50 to-white border-slate-200'}`}>
        {/* Day label */}
        <span className={`text-sm font-bold uppercase tracking-wider ${isSecondWeek ? 'text-blue-700' : 'text-slate-700'}`}>
            {dia.sigla}
        </span>

        {/* Progress circle */}
        <div className="relative w-[70px] h-[70px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={isSecondWeek ? "#2563eb" : "#64748b"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={buildCircleDasharray(dia.aderencia, 40)}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-slate-900 font-black text-base leading-none">
                    {dia.aderencia.toFixed(1)}%
                </span>
            </div>
        </div>

        {/* Hours delivered */}
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5 text-center">
            <span className="text-[0.55rem] font-semibold text-emerald-600 uppercase block">Entregue</span>
            <span className="font-bold text-emerald-700 text-sm block" style={buildTimeTextStyle(dia.horasEntregues, 0.8)}>
                {dia.horasEntregues}
            </span>
        </div>

        {/* Variation (only for second week) */}
        {variacao && (
            <div className={`w-full rounded-lg px-2 py-1.5 text-center ${variacao.horasPositiva ? 'bg-emerald-100 border border-emerald-300' : 'bg-rose-100 border border-rose-300'}`}>
                <div className={`flex items-center justify-center gap-0.5 font-bold text-xs ${variacao.horasPositiva ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {variacao.horasPositiva ? (
                        <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4l-8 8h5v8h6v-8h5z" />
                        </svg>
                    ) : (
                        <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 20l8-8h-5V4H9v8H4z" />
                        </svg>
                    )}
                    <span style={buildTimeTextStyle(variacao.horas, 0.7)}>{variacao.horas}</span>
                </div>
                <span className={`text-[0.6rem] font-semibold ${variacao.percentualPositiva ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {variacao.percentual}
                </span>
            </div>
        )}
    </div>
);
