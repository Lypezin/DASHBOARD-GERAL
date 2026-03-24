import React from 'react';
import { buildTimeTextStyle } from '@/components/apresentacao/utils';

export interface DiaSemanaResumo {
    nome: string;
    sigla: string;
    aderencia: number;
    horasEntregues: string;
    horasPlanejadas: string;
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
        <div className={`rounded-xl border px-2 py-3 flex flex-col items-center gap-2 ${isSecondWeek ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/30 dark:to-slate-800 border-blue-200 dark:border-blue-800/50' : 'bg-gradient-to-b from-sky-50 to-white dark:from-sky-900/30 dark:to-slate-800 border-sky-200 dark:border-sky-800/50'}`}>
            {/* Day label */}
            <span className={`text-sm font-bold uppercase tracking-wider ${isSecondWeek ? 'text-blue-700 dark:text-blue-400' : 'text-sky-700 dark:text-sky-400'}`}>
                {dia.sigla}
            </span>

            {/* Progress circle */}
            <div className={`relative w-[72px] h-[72px] animate-scale-in ${isActive ? 'animate-pulse-scale delay-500' : ''}`}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="34" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="7" fill="none" />
                    <circle
                        cx="50"
                        cy="50"
                        r="34"
                        stroke={isSecondWeek ? "#2563eb" : "#38bdf8"}
                        strokeWidth="7"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(animatedAderencia, 40)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-slate-900 dark:text-slate-100 font-black leading-none tracking-tighter ${dia.aderencia >= 100 ? 'text-[0.55rem]' : 'text-xs'}`}>
                        {dia.aderencia >= 1000 ? '>999' : dia.aderencia.toFixed(1) + '%'}
                    </span>
                </div>
            </div>

            {/* Hours delivered & Meta */}
            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-md px-1 py-1.5 text-center">
                <span className="text-[0.55rem] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block leading-tight">Entregue</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 text-[0.85rem] block leading-tight" style={buildTimeTextStyle(dia.horasEntregues, 0.75)}>
                    {dia.horasEntregues}
                </span>
                <div className="mt-1 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/30">
                    <span className="text-[0.55rem] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                        Meta: {dia.horasPlanejadas}
                    </span>
                </div>
            </div>

            {/* Variation (only for second week) */}
            {variacao && (
                <div className={`w-full rounded-md px-1.5 py-1.5 text-center ${variacao.horasPositiva ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-800/50' : 'bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800/50'}`}>
                    <div className={`flex items-center justify-center gap-0.5 font-bold text-[0.7rem] ${variacao.horasPositiva ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
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
                    <span className={`text-[0.6rem] font-semibold ${variacao.percentualPositiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {variacao.percentual}
                    </span>
                </div>
            )}
        </div>
    );
};
