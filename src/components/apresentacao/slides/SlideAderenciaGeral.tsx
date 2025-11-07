import React from 'react';
import SlideWrapper from '../SlideWrapper';

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
  const circumference = 2 * Math.PI * 170; // r = 170
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
      style={{ padding: '120px 140px' }}
    >
      <header className="text-center mb-24">
        <h2 className="text-[9rem] font-black leading-none tracking-wider mb-6">ADERÊNCIA GERAL</h2>
        <p className="text-[5rem] font-light opacity-90">
          SEMANAS {semana1.numeroSemana} &amp; {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full justify-center gap-28">
        {[semana1, semana2].map((semana, index) => (
          <div key={semana.numeroSemana} className="flex flex-col items-center gap-10">
            <h3 className="text-[4.5rem] font-semibold uppercase tracking-wide">
              SEMANA {semana.numeroSemana}
            </h3>

            <div className="relative w-[460px] h-[460px]">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 400 400"
                style={{ position: 'absolute', inset: 0 }}
              >
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="40"
                  fill="none"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  stroke="#ffffff"
                  strokeWidth="40"
                  fill="none"
                  strokeDasharray={buildCircleDasharray(semana.aderencia)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9rem] font-black leading-none">
                  {semana.aderencia.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="w-[620px] space-y-6">
              <div className="flex items-center justify-between rounded-3xl bg-white/15 px-10 py-8">
                <span className="text-[3.4rem] font-medium opacity-85">🎯 Planejado</span>
                <span className="text-[3.8rem] font-bold text-blue-200">{semana.horasPlanejadas}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-white/15 px-10 py-8">
                <span className="text-[3.4rem] font-medium opacity-85">✅ Entregue</span>
                <span className="text-[3.8rem] font-bold text-emerald-200">{semana.horasEntregues}</span>
              </div>
              {index === 1 && (
                <div className="rounded-3xl bg-white/10 px-10 py-8 text-center">
                  <p className="text-[3rem] font-medium opacity-85 mb-3">Variação de Horas Entregues</p>
                  <p
                    className={`text-[4rem] font-black ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
                  >
                    {variacao.horasDiferenca}
                  </p>
                  <p
                    className={`text-[3rem] font-semibold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
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

