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
  const circumference = 2 * Math.PI * 140; // r = 140 (reduzido para dar espaço ao texto)
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
      style={{ padding: '80px 100px' }}
    >
      <header className="text-center mb-14">
        <h2 className="text-[6.5rem] font-black leading-none tracking-wider mb-4">ADERÊNCIA GERAL</h2>
        <p className="text-[3.8rem] font-light opacity-90">
          SEMANAS {semana1.numeroSemana} &amp; {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full justify-center gap-16">
        {[semana1, semana2].map((semana, index) => (
          <div key={semana.numeroSemana} className="flex flex-col items-center gap-8">
            <h3 className="text-[3.2rem] font-semibold uppercase tracking-wide text-center">
              SEMANA {semana.numeroSemana}
            </h3>

            <div className="relative w-[380px] h-[380px] flex items-center justify-center">
              <svg
                className="absolute inset-0 w-full h-full transform -rotate-90"
                viewBox="0 0 300 300"
                preserveAspectRatio="xMidYMid meet"
              >
                <circle
                  cx="150"
                  cy="150"
                  r="135"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="28"
                  fill="none"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="135"
                  stroke="#ffffff"
                  strokeWidth="28"
                  fill="none"
                  strokeDasharray={buildCircleDasharray(semana.aderencia)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <span
                  className="font-black"
                  style={buildCircleTextStyle(semana.aderencia, 6.5, 3.8)}
                >
                  {semana.aderencia.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="w-[520px] space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-white/15 px-8 py-5">
                <span className="text-[2.4rem] font-medium opacity-85">🎯 Planejado</span>
                <span 
                  className="font-bold text-blue-200"
                  style={buildTimeTextStyle(semana.horasPlanejadas, 2.8)}
                >
                  {semana.horasPlanejadas}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/15 px-8 py-5">
                <span className="text-[2.4rem] font-medium opacity-85">✅ Entregue</span>
                <span 
                  className="font-bold text-emerald-200"
                  style={buildTimeTextStyle(semana.horasEntregues, 2.8)}
                >
                  {semana.horasEntregues}
                </span>
              </div>
              {index === 1 && (
                <div className="rounded-2xl bg-white/10 px-8 py-5 text-center">
                  <p className="text-[2.2rem] font-medium opacity-85 mb-2">Variação de Horas Entregues</p>
                  <p
                    className={`font-black ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
                    style={buildTimeTextStyle(variacao.horasDiferenca, 2.8)}
                  >
                    {variacao.horasDiferenca}
                  </p>
                  <p
                    className={`text-[2.2rem] font-semibold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
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

