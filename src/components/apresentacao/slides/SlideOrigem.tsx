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
  const circumference = 2 * Math.PI * 100;
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
            <div className="text-center space-y-3">
              <h3 className="text-[2.8rem] font-semibold uppercase tracking-wide leading-tight">
                {item.nome}
              </h3>
              <p className="text-[2.2rem] font-medium opacity-80">
                🎯 Planejado: <span className="font-bold text-blue-200">{item.horasPlanejadas}</span>
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-12">
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-5 flex-1">
                  <span className="text-[2rem] font-semibold text-center">
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div className="relative w-[240px] h-[240px] flex items-center justify-center">
                    <svg
                      className="absolute inset-0 w-full h-full transform -rotate-90"
                      viewBox="0 0 220 220"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <circle cx="110" cy="110" r="95" stroke="rgba(255,255,255,0.2)" strokeWidth="20" fill="none" />
                      <circle
                        cx="110"
                        cy="110"
                        r="95"
                        stroke="#ffffff"
                        strokeWidth="20"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <span
                        className="font-black"
                        style={buildCircleTextStyle(semana.aderencia, 4.2, 2.6)}
                      >
                        {semana.aderencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span 
                    className="font-semibold text-emerald-100 text-center"
                    style={buildTimeTextStyle(semana.horasEntregues, 2.0)}
                  >
                    {semana.horasEntregues}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full pt-3">
              {item.variacoes.map((variacao) => (
                <div
                  key={variacao.label}
                  className="rounded-xl bg-white/10 px-3 py-3 text-center flex flex-col items-center justify-center min-h-[80px]"
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

