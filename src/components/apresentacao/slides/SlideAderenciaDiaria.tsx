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

const SlideAderenciaDiaria: React.FC<SlideAderenciaDiariaProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  semana1Dias,
  semana2Dias,
}) => {
  const renderDiaCard = (
    dia: DiaSemanaResumo | DiaSemanaComparado,
    semanaLabel: string,
    isSecondWeek: boolean = false,
    extras?: Partial<DiaSemanaComparado>
  ) => {
    const comparativo = extras ?? {};
    const isComparado = isSecondWeek && 'diferencaHoras' in (extras || {});

    return (
      <div key={`${semanaLabel}-${dia.sigla}`} className="rounded-xl bg-white border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm">
        <span className="text-base font-bold text-slate-700 uppercase tracking-wide">{dia.sigla}</span>

        {/* Progress circle - much larger */}
        <div className="relative w-[80px] h-[80px]">
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'rotate(-90deg)' }}
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#2563eb"
              strokeWidth="8"
              fill="none"
              strokeDasharray={buildCircleDasharray(dia.aderencia, 42)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-900 font-black text-lg leading-none">
              {dia.aderencia.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Hours delivered */}
        <div className="w-full rounded-lg bg-slate-50 border border-slate-200 px-2 py-2 text-center">
          <span className="text-[0.7rem] font-medium text-slate-500 uppercase block">Entregue</span>
          <span className="font-bold text-emerald-600 block text-sm" style={buildTimeTextStyle(dia.horasEntregues, 0.875)}>
            {dia.horasEntregues}
          </span>
        </div>

        {/* Variation indicators for second week */}
        {isComparado && (
          <div className="w-full rounded-lg bg-gradient-to-b from-slate-100 to-white border border-slate-200 px-2 py-2 text-center">
            <span className="text-[0.65rem] font-medium text-slate-500 uppercase block mb-1">Variação</span>
            <div className="flex flex-col items-center gap-1">
              <span className={`font-bold text-sm leading-tight flex items-center gap-1 ${comparativo.diferencaHorasPositiva ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comparativo.diferencaHorasPositiva ? (
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                  </svg>
                )}
                {comparativo.diferencaHoras}
              </span>
              <span className={`text-xs font-semibold leading-tight ${comparativo.diferencaPercentualHorasPositiva ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comparativo.diferencaPercentualHoras}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '24px 48px' }}>
      {/* Header */}
      <header className="text-center mb-5">
        <div className="inline-block">
          <h2 className="text-[2.5rem] font-black tracking-wider text-blue-600 leading-none">
            ADERÊNCIA DIÁRIA
          </h2>
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
        </div>
        <p className="text-lg font-light text-slate-500 mt-2">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
      </header>

      {/* Content - use more vertical space */}
      <section className="flex-1 flex flex-col gap-5">
        {/* Week 1 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 px-4 py-1.5 bg-slate-100 rounded-full">
              SEMANA {numeroSemana1}
            </h3>
            <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-slate-300" />
          </div>
          <div className="grid grid-cols-7 gap-3">
            {semana1Dias.map((dia) => renderDiaCard(dia, 'sem1', false))}
          </div>
        </div>

        {/* Week 2 with variations */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-blue-300" />
            <h3 className="text-lg font-bold text-white px-4 py-1.5 bg-blue-600 rounded-full">
              SEMANA {numeroSemana2}
            </h3>
            <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-blue-300" />
          </div>
          <div className="grid grid-cols-7 gap-3">
            {semana2Dias.map((dia) =>
              renderDiaCard(dia, 'sem2', true, {
                diferencaHoras: dia.diferencaHoras,
                diferencaHorasPositiva: dia.diferencaHorasPositiva,
                diferencaPercentualHoras: dia.diferencaPercentualHoras,
                diferencaPercentualHorasPositiva: dia.diferencaPercentualHorasPositiva,
                diferencaAderencia: dia.diferencaAderencia,
                diferencaAderenciaPositiva: dia.diferencaAderenciaPositiva,
              })
            )}
          </div>
        </div>

        {/* Summary comparison row */}
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-7 gap-3">
            {semana2Dias.map((dia) => (
              <div key={`summary-${dia.sigla}`} className="text-center">
                <span className="text-sm font-medium text-slate-500 block mb-1.5">{dia.sigla}</span>
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${dia.diferencaPercentualHorasPositiva
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
                  }`}>
                  {dia.diferencaPercentualHorasPositiva ? (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 20l8-8h-5V4H9v8H4z" />
                    </svg>
                  )}
                  {dia.diferencaPercentualHoras}
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
