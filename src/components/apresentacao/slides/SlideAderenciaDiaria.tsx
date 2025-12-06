import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';

interface DiaSemanaResumo {
  nome: string;
  sigla: string;
  aderencia: number;
  horasEntregues: string;
}

interface DiaSemanaComparado extends DiaSemanaResumo {
  diferencaHoras: string;
  diferencaHorasPositiva: boolean;
  diferencaPercentualHoras: string;
  diferencaPercentualHorasPositiva: boolean;
  diferencaAderencia: string;
  diferencaAderenciaPositiva: boolean;
}

interface SlideAderenciaDiariaProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  semana1Dias: DiaSemanaResumo[];
  semana2Dias: DiaSemanaComparado[];
}

const buildCircleDasharray = (valor: number, radius: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * radius;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Day card component for clean reuse
const DayCard: React.FC<{
  dia: DiaSemanaResumo;
  isSecondWeek?: boolean;
  variacao?: {
    horas: string;
    horasPositiva: boolean;
    percentual: string;
    percentualPositiva: boolean;
  };
}> = ({ dia, isSecondWeek = false, variacao }) => (
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

const SlideAderenciaDiaria: React.FC<SlideAderenciaDiariaProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  semana1Dias,
  semana2Dias,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '28px 40px' }}>
      {/* Header */}
      <header className="text-center mb-5">
        <div className="inline-block">
          <h2 className="text-[2.25rem] font-black tracking-wider text-blue-600 leading-none">
            ADERÊNCIA DIÁRIA
          </h2>
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
        </div>
        <p className="text-lg font-light text-slate-500 mt-2">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
      </header>

      {/* Content */}
      <section className="flex-1 flex flex-col gap-4">
        {/* Week 1 Section */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-300" />
            <h3 className="text-base font-bold text-slate-700 px-5 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              SEMANA {numeroSemana1}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-300" />
          </div>
          <div className="grid grid-cols-7 gap-3">
            {semana1Dias.map((dia) => (
              <DayCard key={`sem1-${dia.sigla}`} dia={dia} isSecondWeek={false} />
            ))}
          </div>
        </div>

        {/* Week 2 Section */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-300" />
            <h3 className="text-base font-bold text-white px-5 py-1.5 bg-blue-600 rounded-full shadow">
              SEMANA {numeroSemana2}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-300" />
          </div>
          <div className="grid grid-cols-7 gap-3">
            {semana2Dias.map((dia) => (
              <DayCard
                key={`sem2-${dia.sigla}`}
                dia={dia}
                isSecondWeek={true}
                variacao={{
                  horas: dia.diferencaHoras,
                  horasPositiva: dia.diferencaHorasPositiva,
                  percentual: dia.diferencaPercentualHoras,
                  percentualPositiva: dia.diferencaPercentualHorasPositiva,
                }}
              />
            ))}
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-xl border border-slate-200 px-4 py-3 mt-auto">
          <div className="grid grid-cols-7 gap-3">
            {semana2Dias.map((dia) => (
              <div key={`summary-${dia.sigla}`} className="text-center">
                <span className="text-xs font-medium text-slate-500 block mb-1">{dia.sigla}</span>
                <div className={`inline-flex items-center justify-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-bold ${dia.diferencaPercentualHorasPositiva
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                  {dia.diferencaPercentualHorasPositiva ? (
                    <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                  ) : (
                    <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 20l8-8h-5V4H9v8H4z" />
                    </svg>
                  )}
                  <span>{dia.diferencaPercentualHoras}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SlideWrapper>
  );
};

export default SlideAderenciaDiaria;
