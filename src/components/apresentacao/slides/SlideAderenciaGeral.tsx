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
      style={{ padding: '40px 50px', overflow: 'visible' }}
    >
      <header className="text-center mb-4">
        <h2 className="text-[2.5rem] font-black leading-none tracking-wider mb-1.5">ADERÊNCIA GERAL</h2>
        <p className="text-[1.25rem] font-light opacity-90">
          SEMANAS {semana1.numeroSemana} &amp; {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full justify-center items-start gap-4" style={{ overflow: 'visible' }}>
        {/* Semana 1 */}
        <div className="flex flex-col items-center gap-3 flex-1" style={{ overflow: 'visible' }}>
          <h3 className="text-[1.5rem] font-semibold uppercase tracking-wide text-center">
            SEMANA {semana1.numeroSemana}
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
                strokeDasharray={buildCircleDasharray(semana1.aderencia)}
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
                  ...buildCircleTextStyle(semana1.aderencia, 1.8, 1.0),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  overflow: 'visible',
                }}
              >
                {semana1.aderencia.toFixed(1)}%
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
                style={buildTimeTextStyle(semana1.horasPlanejadas, 1.25)}
              >
                {semana1.horasPlanejadas}
              </span>
            </div>
            <div className="rounded-lg bg-white/15 px-3 py-2 flex flex-col items-center gap-1 text-center" style={{ overflow: 'visible' }}>
              <span className="text-[1rem] font-medium opacity-85">
                Entregue
              </span>
              <span
                className="font-bold text-emerald-200"
                style={buildTimeTextStyle(semana1.horasEntregues, 1.15)}
              >
                {semana1.horasEntregues}
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Central - Variação */}
        <div className="flex flex-col items-center justify-center" style={{ overflow: 'visible', marginTop: '50px' }}>
          <div className="rounded-lg bg-white/10 px-3 py-2.5 text-center flex flex-col items-center gap-1.5" style={{ overflow: 'visible' }}>
            <p className="text-[1rem] font-medium opacity-85">Variação</p>
            <p
              className={`font-bold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={buildTimeTextStyle(variacao.horasDiferenca, 1.15)}
            >
              {variacao.horasDiferenca}
            </p>
            <p
              className={`text-[1rem] font-semibold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {variacao.horasPercentual}
            </p>
          </div>
        </div>

        {/* Semana 2 */}
        <div className="flex flex-col items-center gap-3 flex-1" style={{ overflow: 'visible' }}>
          <h3 className="text-[1.5rem] font-semibold uppercase tracking-wide text-center">
            SEMANA {semana2.numeroSemana}
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
                strokeDasharray={buildCircleDasharray(semana2.aderencia)}
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
                  ...buildCircleTextStyle(semana2.aderencia, 1.8, 1.0),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  overflow: 'visible',
                }}
              >
                {semana2.aderencia.toFixed(1)}%
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
                style={buildTimeTextStyle(semana2.horasPlanejadas, 1.25)}
              >
                {semana2.horasPlanejadas}
              </span>
            </div>
            <div className="rounded-lg bg-white/15 px-3 py-2 flex flex-col items-center gap-1 text-center" style={{ overflow: 'visible' }}>
              <span className="text-[1rem] font-medium opacity-85">
                Entregue
              </span>
              <span
                className="font-bold text-emerald-200"
                style={buildTimeTextStyle(semana2.horasEntregues, 1.15)}
              >
                {semana2.horasEntregues}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideAderenciaGeral;

