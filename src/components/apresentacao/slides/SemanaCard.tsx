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
    const circumference = 2 * Math.PI * 125; // r = 125 (ajustado para container maior)
    return `${(clamped / 100) * circumference} ${circumference}`;
};

export const SemanaCard: React.FC<SemanaCardProps> = ({ semana }) => {
    return (
        <div className="flex flex-col items-center gap-3 flex-1" style={{ overflow: 'visible' }}>
            <h3 className="text-[1.5rem] font-semibold uppercase tracking-wide text-center">
                SEMANA {semana.numeroSemana}
            </h3>

            <div
                className="relative flex items-center justify-center"
                style={{
                    width: '170px',
                    height: '170px',
                    overflow: 'visible',
                }}
            >
                <svg
                    className="absolute"
                    style={{
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        transform: 'rotate(-90deg)',
                        overflow: 'visible',
                    }}
                    viewBox="0 0 300 300"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <circle
                        cx="150"
                        cy="150"
                        r="125"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="16"
                        fill="none"
                    />
                    <circle
                        cx="150"
                        cy="150"
                        r="125"
                        stroke="#ffffff"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                    />
                </svg>
                <div
                    className="absolute flex items-center justify-center"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '60%',
                        height: '60%',
                        pointerEvents: 'none',
                        overflow: 'visible',
                    }}
                >
                    <span
                        style={{
                            ...buildCircleTextStyle(semana.aderencia, 1.8, 1.0),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            textAlign: 'center',
                            overflow: 'visible',
                        }}
                    >
                        {semana.aderencia.toFixed(1)}%
                    </span>
                </div>
            </div>

            <div className="w-full max-w-[280px] space-y-1.5" style={{ overflow: 'visible' }}>
                <div className="rounded-lg bg-white/15 px-3 py-2 flex flex-col items-center gap-1 text-center" style={{ overflow: 'visible' }}>
                    <span className="text-[1rem] font-medium opacity-85">
                        Planejado
                    </span>
                    <span
                        className="font-bold text-blue-200"
                        style={buildTimeTextStyle(semana.horasPlanejadas, 1.25)}
                    >
                        {semana.horasPlanejadas}
                    </span>
                </div>
                <div className="rounded-lg bg-white/15 px-3 py-2 flex flex-col items-center gap-1 text-center" style={{ overflow: 'visible' }}>
                    <span className="text-[1rem] font-medium opacity-85">
                        Entregue
                    </span>
                    <span
                        className="font-bold text-emerald-200"
                        style={buildTimeTextStyle(semana.horasEntregues, 1.15)}
                    >
                        {semana.horasEntregues}
                    </span>
                </div>
            </div>
        </div>
    );
};
