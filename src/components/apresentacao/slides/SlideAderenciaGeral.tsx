import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildCircleTextStyle, buildTimeTextStyle } from '../utils';

interface SemanaResumo {
  numeroSemana: string;
  aderencia: number;
  horasPlanejadas: string;
  horasEntregues: string;
}

interface VariacaoResumo {
  horasDiferenca: string;
  horasPercentual: string;
  positiva: boolean;
}

interface SlideAderenciaGeralProps {
  isVisible: boolean;
  semana1: SemanaResumo;
  semana2: SemanaResumo;
  variacao: VariacaoResumo;
}

const buildCircleDasharray = (valor: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * 125; // r = 125 (ajustado para container maior)
  return `${(clamped / 100) * circumference} ${circumference}`;
};

const SlideAderenciaGeral: React.FC<SlideAderenciaGeralProps> = ({
  isVisible,
  semana1,
  semana2,
  variacao,
}) => {
  return (
    <SlideWrapper
      isVisible={isVisible}
      className="items-center justify-center"
      style={{ padding: '60px 80px', overflow: 'visible' }}
    >
      <header className="text-center mb-10">
        <h2 className="text-[6rem] font-black leading-none tracking-wider mb-3">ADERÊNCIA GERAL</h2>
        <p className="text-[3.5rem] font-light opacity-90">
          SEMANAS {semana1.numeroSemana} &amp; {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full justify-center gap-12" style={{ overflow: 'visible' }}>
        {[semana1, semana2].map((semana, index) => (
          <div key={semana.numeroSemana} className="flex flex-col items-center gap-6" style={{ overflow: 'visible' }}>
            <h3 className="text-[2.8rem] font-semibold uppercase tracking-wide text-center">
              SEMANA {semana.numeroSemana}
            </h3>

            <div 
              className="relative flex items-center justify-center"
              style={{ 
                width: '380px', 
                height: '380px',
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
                  strokeWidth="22"
                  fill="none"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="125"
                  stroke="#ffffff"
                  strokeWidth="22"
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
                    ...buildCircleTextStyle(semana.aderencia, 4.0, 2.0),
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

            <div className="w-full max-w-[480px] space-y-3" style={{ overflow: 'visible' }}>
              <div className="rounded-2xl bg-white/15 px-6 py-5 flex flex-col items-center gap-2 text-center" style={{ overflow: 'visible' }}>
                <span className="text-[2.2rem] font-medium opacity-85 flex items-center gap-3">
                  <span aria-hidden className="text-[2.6rem] leading-none">🎯</span>
                  Planejado
                </span>
                <span
                  className="font-bold text-blue-200"
                  style={buildTimeTextStyle(semana.horasPlanejadas, 2.4)}
                >
                  {semana.horasPlanejadas}
                </span>
              </div>
              <div className="rounded-2xl bg-white/15 px-6 py-5 flex flex-col items-center gap-2 text-center" style={{ overflow: 'visible' }}>
                <span className="text-[2.2rem] font-medium opacity-85 flex items-center gap-3">
                  <span aria-hidden className="text-[2.6rem] leading-none">✅</span>
                  Entregue
                </span>
                <span
                  className="font-bold text-emerald-200"
                  style={buildTimeTextStyle(semana.horasEntregues, 2.4)}
                >
                  {semana.horasEntregues}
                </span>
              </div>
              {index === 1 && (
                <div className="rounded-2xl bg-white/10 px-6 py-5 text-center flex flex-col items-center gap-2" style={{ overflow: 'visible' }}>
                  <p className="text-[2rem] font-medium opacity-85">Variação de Horas</p>
                  <p
                    className={`font-black ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
                    style={buildTimeTextStyle(variacao.horasDiferenca, 2.4)}
                  >
                    {variacao.horasDiferenca}
                  </p>
                  <p
                    className={`text-[2rem] font-semibold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
                  >
                    {variacao.horasPercentual}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
};

export default SlideAderenciaGeral;

