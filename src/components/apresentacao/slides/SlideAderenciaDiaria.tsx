import React from 'react';
import SlideWrapper from '../SlideWrapper';

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
  const circumference = 2 * Math.PI * 70; // r = 70
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
      <div key={`${semanaLabel}-${dia.sigla}`} className="rounded-[32px] bg-white/12 px-8 py-9 flex flex-col items-center gap-6">
        <span className="text-[3rem] font-semibold opacity-85">{dia.sigla}</span>
        <div className="relative w-[190px] h-[190px]">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 200 200"
            style={{ position: 'absolute', inset: 0 }}
          >
            <circle cx="100" cy="100" r="70" stroke="rgba(255,255,255,0.2)" strokeWidth="18" fill="none" />
            <circle
              cx="100"
              cy="100"
              r="70"
              stroke="#ffffff"
              strokeWidth="18"
              fill="none"
              strokeDasharray={buildCircleDasharray(dia.aderencia)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[3.8rem] font-black leading-none">{dia.aderencia.toFixed(1)}%</span>
          </div>
        </div>
        <span className="text-[2.8rem] font-semibold text-emerald-100">{dia.horasEntregues}</span>
        {isComparado && (
          <div className="w-full space-y-3 text-center">
            <p
              className={`text-[2.4rem] font-bold ${comparativo.diferencaHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {comparativo.diferencaHoras}
            </p>
            <p
              className={`text-[2.2rem] font-semibold ${comparativo.diferencaPercentualHorasPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {comparativo.diferencaPercentualHoras}
            </p>
            <p
              className={`text-[2.1rem] font-semibold ${comparativo.diferencaAderenciaPositiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {comparativo.diferencaAderencia}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '110px 120px' }}>
      <header className="text-center mb-16">
        <h2 className="text-[8.5rem] font-black leading-none tracking-wider mb-6">ADERÊNCIA DIÁRIA</h2>
        <p className="text-[4.8rem] font-light opacity-90">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
      </header>

      <section className="space-y-12">
        <div>
          <h3 className="text-[3.4rem] font-semibold text-center mb-8">SEMANA {numeroSemana1}</h3>
          <div className="grid grid-cols-7 gap-6">
            {semana1Dias.map((dia) => renderDiaCard(dia, 'sem1'))}
          </div>
        </div>

        <div>
          <h3 className="text-[3.4rem] font-semibold text-center mb-8">SEMANA {numeroSemana2}</h3>
          <div className="grid grid-cols-7 gap-6">
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

