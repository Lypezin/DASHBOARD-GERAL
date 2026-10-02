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
            <div className={`rounded-md border px-8 py-3 ${isHighlighted ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}>
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
                    <circle cx="90" cy="90" r="80" stroke={isHighlighted ? "#173b2f" : "#8a9a80"} strokeWidth="14" fill="none" strokeDasharray={buildCircleDasharray(animatedAderencia)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
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
                <div className="flex flex-col items-center rounded-lg border border-border bg-card px-5 py-3" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Planejado
                    </span>
                    <span
                        className="font-semibold text-foreground"
                        style={buildTimeTextStyle(semana.horasPlanejadas, 1.7)}
                    >
                        {semana.horasPlanejadas}
                    </span>
                </div>

                {/* Delivered hours */}
                <div className="flex flex-col items-center rounded-lg border border-border bg-accent px-5 py-3" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
                    <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                        Entregue
                    </span>
                    <span
                        className="font-semibold text-primary"
                        style={buildTimeTextStyle(semana.horasEntregues, 1.6)}
                    >
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
