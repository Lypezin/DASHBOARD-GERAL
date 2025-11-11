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
  const circumference = 2 * Math.PI * 50; // r = 50 (ajustado para container maior)
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
      <div key={`${semanaLabel}-${dia.sigla}`} className="rounded-lg bg-white/12 px-1 py-1 flex flex-col items-center gap-1" style={{ overflow: 'visible' }}>
        <span className="text-[0.875rem] font-semibold opacity-85 text-center">{dia.sigla}</span>
        <div 
          className="relative flex items-center justify-center"
          style={{ 
            width: '72px', 
            height: '72px',
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
            viewBox="0 0 120 120"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.25)" strokeWidth="6" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#ffffff"
              strokeWidth="6"
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
              width: '60%',
              height: '60%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <span 
              style={{
                ...buildCircleTextStyle(dia.aderencia, 0.9, 0.5),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                textAlign: 'center',
                overflow: 'visible',
              }}
            >
              {dia.aderencia.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-white/10 px-1.5 py-1 w-full flex flex-col items-center gap-0.5" style={{ overflow: 'visible' }}>
          <span className="text-[0.625rem] font-medium opacity-85">Horas Entregues</span>
          <span
            className="font-semibold text-emerald-100 text-center"
            style={buildTimeTextStyle(dia.horasEntregues, 0.6875)}
          >
            {dia.horasEntregues}
          </span>
        </div>
        {isComparado && (
          <div className="w-full rounded-lg bg-white/10 px-1.5 py-1 mt-0.5 text-center flex flex-col items-center gap-0.5" style={{ overflow: 'visible' }}>
            <span className="text-[0.625rem] font-medium opacity-85">Diferenças</span>
            <p
              className={`font-bold leading-tight ${comparativo.diferencaHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={buildTimeTextStyle(comparativo.diferencaHoras || '', 0.75)}
            >
              {comparativo.diferencaHoras}
            </p>
            <p
              className={`text-[0.625rem] font-semibold leading-tight ${comparativo.diferencaPercentualHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {comparativo.diferencaPercentualHoras}
            </p>
            <p
              className={`text-[0.5625rem] font-semibold leading-tight ${comparativo.diferencaAderenciaPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {comparativo.diferencaAderencia}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '40px 50px', overflow: 'visible' }}>
      <header className="text-center mb-3">
        <h2 className="text-[2rem] font-black leading-none tracking-wider mb-1">ADERÊNCIA DIÁRIA</h2>
        <p className="text-[1.25rem] font-light opacity-90">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
      </header>

      <section className="space-y-3" style={{ overflow: 'visible' }}>
        <div style={{ overflow: 'visible' }}>
          <h3 className="text-[0.9375rem] font-semibold text-center mb-1.5">SEMANA {numeroSemana1}</h3>
          <div className="grid grid-cols-7 gap-1" style={{ overflow: 'visible' }}>
            {semana1Dias.map((dia) => renderDiaCard(dia, 'sem1'))}
          </div>
        </div>

        <div style={{ overflow: 'visible' }}>
          <h3 className="text-[0.9375rem] font-semibold text-center mb-1.5">SEMANA {numeroSemana2}</h3>
          <div className="grid grid-cols-7 gap-1" style={{ overflow: 'visible' }}>
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

