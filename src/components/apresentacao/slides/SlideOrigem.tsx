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
    <SlideWrapper isVisible={isVisible} style={{ padding: '35px 45px', overflow: 'visible' }}>
      <header className="text-center mb-5">
        <h2 className="text-[2.5rem] font-black leading-none tracking-wider mb-1.5">ORIGENS</h2>
        <p className="text-[1.5rem] font-light opacity-90 mb-1">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[1rem] font-medium opacity-75">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 flex-1" style={{ overflow: 'visible' }}>
        {itens.map((item) => (
          <div
            key={item.nome}
            className="relative flex flex-col items-center gap-3 rounded-2xl bg-white/12 px-4 py-4"
            style={{ overflow: 'visible' }}
          >
            <div className="text-center space-y-2 w-full max-w-[350px] mx-auto" style={{ overflow: 'visible' }}>
              <h3 className="text-[1.125rem] font-semibold uppercase tracking-wide leading-tight">
                {item.nome}
              </h3>
              <div className="rounded-lg bg-white/12 px-3 py-2 flex flex-col items-center gap-1" style={{ overflow: 'visible' }}>
                <span className="text-[0.9375rem] font-medium opacity-85">
                  Planejado
                </span>
                <span
                  className="text-[1.125rem] font-bold text-blue-200"
                  style={buildTimeTextStyle(item.horasPlanejadas, 1.2)}
                >
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-5" style={{ overflow: 'visible' }}>
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1" style={{ overflow: 'visible' }}>
                  <span className="text-[0.9375rem] font-semibold text-center">
                    SEMANA {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div 
                    className="relative flex items-center justify-center"
                    style={{ 
                      width: '140px', 
                      height: '140px',
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
                      }}
                      viewBox="0 0 200 200"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,0.25)" strokeWidth="14" fill="none" />
                      <circle
                        cx="100"
                        cy="100"
                        r="88"
                        stroke="#ffffff"
                        strokeWidth="14"
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
                          ...buildCircleTextStyle(semana.aderencia, 1.4, 0.8),
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
                  <div className="rounded-lg bg-white/10 px-2 py-1.5 w-full flex flex-col items-center gap-0.5" style={{ overflow: 'visible' }}>
                    <span className="text-[0.875rem] font-medium opacity-85">Horas Entregues</span>
                    <span
                      className="font-semibold text-emerald-100 text-center"
                      style={buildTimeTextStyle(semana.horasEntregues, 1.2)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1.5 w-full pt-1" style={{ overflow: 'visible' }}>
              {item.variacoes.map((variacao) => (
                <div
                  key={variacao.label}
                  className="rounded-lg bg-white/10 px-2 py-1.5 text-center flex flex-col items-center justify-center gap-0.5"
                  style={{ overflow: 'visible' }}
                >
                  <p className="text-[0.75rem] font-medium opacity-80 leading-tight">{variacao.label}</p>
                  <p
                    className={`font-bold leading-tight ${
                      variacao.positivo ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                    style={buildTimeTextStyle(variacao.valor, 1.0)}
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

