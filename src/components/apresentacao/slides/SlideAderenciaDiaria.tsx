import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildCircleTextStyle, buildTimeTextStyle } from '../utils';

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
  const circumference = 2 * Math.PI * 52; // r = 52
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
      <div key={`${semanaLabel}-${dia.sigla}`} className="rounded-[24px] bg-white/12 px-5 py-6 flex flex-col items-center gap-3">
        <span className="text-[2.2rem] font-semibold opacity-85 text-center">{dia.sigla}</span>
        <div 
          className="relative flex items-center justify-center"
          style={{ 
            width: '140px', 
            height: '140px',
            overflow: 'hidden',
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
            }}
            viewBox="0 0 120 120"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.25)" strokeWidth="10" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#ffffff"
              strokeWidth="10"
              fill="none"
              strokeDasharray={buildCircleDasharray(dia.aderencia)}
              strokeLinecap="round"
            />
          </svg>
          <div 
            className="absolute flex items-center justify-center"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '55%',
              height: '55%',
              overflow: 'hidden',
              maxWidth: '55%',
              maxHeight: '55%',
            }}
          >
            <span style={buildCircleTextStyle(dia.aderencia, 3.0, 2.2)}>
              {dia.aderencia.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-3 w-full flex flex-col items-center gap-1">
          <span className="text-[1.6rem] font-medium opacity-85">Horas Entregues</span>
          <span
            className="font-semibold text-emerald-100 text-center"
            style={buildTimeTextStyle(dia.horasEntregues, 1.8)}
          >
            {dia.horasEntregues}
          </span>
        </div>
        {isComparado && (
          <div className="w-full rounded-2xl bg-white/10 px-4 py-3 mt-2 text-center flex flex-col items-center gap-2">
            <span className="text-[1.6rem] font-medium opacity-85">Diferenças</span>
            <p
              className={`font-bold leading-tight ${comparativo.diferencaHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={buildTimeTextStyle(comparativo.diferencaHoras || '', 1.6)}
            >
              {comparativo.diferencaHoras}
            </p>
            <p
              className={`text-[1.5rem] font-semibold leading-tight ${comparativo.diferencaPercentualHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {comparativo.diferencaPercentualHoras}
            </p>
            <p
              className={`text-[1.4rem] font-semibold leading-tight ${comparativo.diferencaAderenciaPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
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

