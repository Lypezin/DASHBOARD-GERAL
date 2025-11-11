import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildCircleTextStyle, buildTimeTextStyle } from '../utils';

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface OrigemComparativo {
  nome: string;
  horasPlanejadas: string;
  semana1: {
    aderencia: number;
    horasEntregues: string;
  };
  semana2: {
    aderencia: number;
    horasEntregues: string;
  };
  variacoes: VariacaoResumo[];
}

interface SlideOrigemProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: OrigemComparativo[];
}

const buildCircleDasharray = (valor: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * 88; // r = 88 (ajustado para container maior)
  return `${(clamped / 100) * circumference} ${circumference}`;
};

const SlideOrigem: React.FC<SlideOrigemProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '80px 100px' }}>
      <header className="text-center mb-14">
        <h2 className="text-[6rem] font-black leading-none tracking-wider mb-4">ORIGENS</h2>
        <p className="text-[3.5rem] font-light opacity-90 mb-3">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[2.2rem] font-medium opacity-75">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-x-12 gap-y-10 flex-1">
        {itens.map((item) => (
          <div
            key={item.nome}
            className="relative flex flex-col items-center gap-8 rounded-[36px] bg-white/12 px-10 py-10"
          >
            <div className="text-center space-y-4 w-full max-w-[420px] mx-auto">
              <h3 className="text-[2.8rem] font-semibold uppercase tracking-wide leading-tight">
                {item.nome}
              </h3>
              <div className="rounded-2xl bg-white/12 px-6 py-5 flex flex-col items-center gap-2">
                <span className="text-[2.2rem] font-medium opacity-85 flex items-center gap-3">
                  <span aria-hidden className="text-[2.8rem] leading-none">🎯</span>
                  Planejado
                </span>
                <span
                  className="text-[2.6rem] font-bold text-blue-200"
                  style={buildTimeTextStyle(item.horasPlanejadas, 2.4)}
                >
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-12">
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-5 flex-1">
                  <span className="text-[2rem] font-semibold text-center">
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div 
                    className="relative flex items-center justify-center"
                    style={{ 
                      width: '270px', 
                      height: '270px',
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
                      viewBox="0 0 200 200"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,0.25)" strokeWidth="16" fill="none" />
                      <circle
                        cx="100"
                        cy="100"
                        r="88"
                        stroke="#ffffff"
                        strokeWidth="16"
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
                        width: '65%',
                        height: '65%',
                        pointerEvents: 'none',
                      }}
                    >
                      <span 
                        style={{
                          ...buildCircleTextStyle(semana.aderencia, 3.2, 1.8),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          textAlign: 'center',
                        }}
                      >
                        {semana.aderencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 w-full flex flex-col items-center gap-1">
                    <span className="text-[1.8rem] font-medium opacity-85">Horas Entregues</span>
                    <span
                      className="font-semibold text-emerald-100 text-center"
                      style={buildTimeTextStyle(semana.horasEntregues, 2.0)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full pt-3">
              {item.variacoes.map((variacao) => (
                <div
                  key={variacao.label}
                  className="rounded-xl bg-white/10 px-4 py-4 text-center flex flex-col items-center justify-center min-h-[88px] gap-1"
                >
                  <p className="text-[1.6rem] font-medium opacity-80 mb-1 leading-tight">{variacao.label}</p>
                  <p
                    className={`font-bold leading-tight ${
                      variacao.positivo ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                    style={buildTimeTextStyle(variacao.valor, 1.8)}
                  >
                    {variacao.valor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
};

export default SlideOrigem;

