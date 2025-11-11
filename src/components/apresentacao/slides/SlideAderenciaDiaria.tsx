import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildCircleTextStyle } from '../utils';

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

const buildCircleDasharray = (valor: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * 60; // r = 60 (reduzido para dar espaço ao texto)
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
    extras?: Partial<DiaSemanaComparado>
  ) => {
    const comparativo = extras ?? {};
    const isComparado = 'diferencaHoras' in (extras || {});

    return (
      <div key={`${semanaLabel}-${dia.sigla}`} className="rounded-[24px] bg-white/12 px-6 py-7 flex flex-col items-center gap-4">
        <span className="text-[2.2rem] font-semibold opacity-85">{dia.sigla}</span>
        <div className="relative w-[150px] h-[150px]">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 140 140"
            style={{ position: 'absolute', inset: 0 }}
          >
            <circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.2)" strokeWidth="14" fill="none" />
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="#ffffff"
              strokeWidth="14"
              fill="none"
              strokeDasharray={buildCircleDasharray(dia.aderencia)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-black leading-none"
              style={buildCircleTextStyle(dia.aderencia, 2.8, 2.1)}
            >
              {dia.aderencia.toFixed(1)}%
            </span>
          </div>
        </div>
        <span className="text-[2rem] font-semibold text-emerald-100 text-center">{dia.horasEntregues}</span>
        {isComparado && (
          <div className="w-full space-y-2 text-center">
            <p
              className={`text-[1.8rem] font-bold leading-tight ${comparativo.diferencaHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {comparativo.diferencaHoras}
            </p>
            <p
              className={`text-[1.6rem] font-semibold leading-tight ${comparativo.diferencaPercentualHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {comparativo.diferencaPercentualHoras}
            </p>
            <p
              className={`text-[1.5rem] font-semibold leading-tight ${comparativo.diferencaAderenciaPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {comparativo.diferencaAderencia}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '80px 100px' }}>
      <header className="text-center mb-12">
        <h2 className="text-[6rem] font-black leading-none tracking-wider mb-4">ADERÊNCIA DIÁRIA</h2>
        <p className="text-[3.5rem] font-light opacity-90">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
      </header>

      <section className="space-y-10">
        <div>
          <h3 className="text-[2.8rem] font-semibold text-center mb-6">SEMANA {numeroSemana1}</h3>
          <div className="grid grid-cols-7 gap-5">
            {semana1Dias.map((dia) => renderDiaCard(dia, 'sem1'))}
          </div>
        </div>

        <div>
          <h3 className="text-[2.8rem] font-semibold text-center mb-6">SEMANA {numeroSemana2}</h3>
          <div className="grid grid-cols-7 gap-5">
            {semana2Dias.map((dia) =>
              renderDiaCard(dia, 'sem2', {
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
      </section>
    </SlideWrapper>
  );
};

export default SlideAderenciaDiaria;

