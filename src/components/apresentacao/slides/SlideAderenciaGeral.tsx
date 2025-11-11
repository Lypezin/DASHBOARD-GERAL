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
      <header className="text-center mb-6">
        <h2 className="text-[3rem] font-black leading-none tracking-wider mb-2">ADERÊNCIA GERAL</h2>
        <p className="text-[1.5rem] font-light opacity-90">
          SEMANAS {semana1.numeroSemana} &amp; {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full justify-center items-start gap-6" style={{ overflow: 'visible' }}>
        {/* Semana 1 */}
        <div className="flex flex-col items-center gap-5 flex-1" style={{ overflow: 'visible' }}>
          <h3 className="text-[1.75rem] font-semibold uppercase tracking-wide text-center">
            SEMANA {semana1.numeroSemana}
          </h3>

          <div 
            className="relative flex items-center justify-center"
            style={{ 
              width: '190px', 
              height: '190px',
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

          <div className="w-full max-w-[300px] space-y-2" style={{ overflow: 'visible' }}>
            <div className="rounded-lg bg-white/15 px-4 py-3 flex flex-col items-center gap-1.5 text-center" style={{ overflow: 'visible' }}>
              <span className="text-[1.125rem] font-medium opacity-85">
                Planejado
              </span>
              <span
                className="font-bold text-blue-200"
                style={buildTimeTextStyle(semana1.horasPlanejadas, 1.5)}
              >
                {semana1.horasPlanejadas}
              </span>
            </div>
            <div className="rounded-lg bg-white/15 px-4 py-3 flex flex-col items-center gap-1.5 text-center" style={{ overflow: 'visible' }}>
              <span className="text-[1.125rem] font-medium opacity-85">
                Entregue
              </span>
              <span
                className="font-bold text-emerald-200"
                style={buildTimeTextStyle(semana1.horasEntregues, 1.375)}
              >
                {semana1.horasEntregues}
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Central - Variação */}
        <div className="flex flex-col items-center justify-center" style={{ overflow: 'visible', marginTop: '60px' }}>
          <div className="rounded-lg bg-white/10 px-4 py-3 text-center flex flex-col items-center gap-2" style={{ overflow: 'visible' }}>
            <p className="text-[1.125rem] font-medium opacity-85">Variação</p>
            <p
              className={`font-bold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
              style={buildTimeTextStyle(variacao.horasDiferenca, 1.375)}
            >
              {variacao.horasDiferenca}
            </p>
            <p
              className={`text-[1.125rem] font-semibold ${variacao.positiva ? 'text-emerald-200' : 'text-rose-200'}`}
            >
              {variacao.horasPercentual}
            </p>
          </div>
        </div>

        {/* Semana 2 */}
        <div className="flex flex-col items-center gap-5 flex-1" style={{ overflow: 'visible' }}>
          <h3 className="text-[1.75rem] font-semibold uppercase tracking-wide text-center">
            SEMANA {semana2.numeroSemana}
          </h3>

          <div 
            className="relative flex items-center justify-center"
            style={{ 
              width: '190px', 
              height: '190px',
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

          <div className="w-full max-w-[300px] space-y-2" style={{ overflow: 'visible' }}>
            <div className="rounded-lg bg-white/15 px-4 py-3 flex flex-col items-center gap-1.5 text-center" style={{ overflow: 'visible' }}>
              <span className="text-[1.125rem] font-medium opacity-85">
                Planejado
              </span>
              <span
                className="font-bold text-blue-200"
                style={buildTimeTextStyle(semana2.horasPlanejadas, 1.5)}
              >
                {semana2.horasPlanejadas}
              </span>
            </div>
            <div className="rounded-lg bg-white/15 px-4 py-3 flex flex-col items-center gap-1.5 text-center" style={{ overflow: 'visible' }}>
              <span className="text-[1.125rem] font-medium opacity-85">
                Entregue
              </span>
              <span
                className="font-bold text-emerald-200"
                style={buildTimeTextStyle(semana2.horasEntregues, 1.375)}
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

