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
        <h2 className="text-[2.5rem] font-black leading-none tracking-wider mb-1.5 text-blue-600">ORIGENS</h2>
        <p className="text-[1.5rem] font-light text-slate-500 mb-1">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[1rem] font-medium opacity-75 text-slate-400">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 flex-1" style={{ overflow: 'visible' }}>
        {itens.map((item) => (
          <div
            key={item.nome}
            className="relative flex flex-col items-center gap-4 rounded-[14px] bg-slate-50 border border-slate-200 px-4 py-4"
            style={{ overflow: 'visible' }}
          >
            <div className="text-center space-y-2 w-full max-w-[350px] mx-auto" style={{ overflow: 'visible' }}>
              <h3 className="text-[22px] font-semibold uppercase tracking-wide leading-tight text-slate-900">
                {item.nome}
              </h3>
              <div className="rounded-[8px] bg-white border border-slate-200 px-3 py-2 flex flex-col items-center gap-1" style={{ overflow: 'visible' }}>
                <span className="text-[15px] font-medium text-slate-500">
                  Planejado
                </span>
                <span
                  className="text-[20px] font-bold text-blue-600"
                  style={buildTimeTextStyle(item.horasPlanejadas, 1.25)}
                >
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-3" style={{ overflow: 'visible' }}>
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1" style={{ overflow: 'visible' }}>
                  <span className="text-[16px] font-bold text-center text-slate-500">
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
                      className="absolute inset-0"
                      viewBox="0 0 200 200"
                      style={{ transform: 'rotate(-90deg)' }}
                    >
                      <circle cx="100" cy="100" r="88" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                      <circle
                        cx="100"
                        cy="100"
                        r="88"
                        stroke="#2563eb"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={buildCircleTextStyle(semana.aderencia, 1.6, 0.9)}
                      className="flex items-center justify-center w-full h-full text-center text-slate-900"
                    >
                      {semana.aderencia.toFixed(1)}%
                    </span>
                  </div>
                  <div className="rounded-[8px] bg-white border border-slate-200 px-3 py-2 w-full flex flex-col items-center gap-1" style={{ overflow: 'visible' }}>
                    <span className="text-[13px] font-medium text-slate-500">Horas Entregues</span>
                    <span
                      className="font-semibold text-emerald-600 text-center"
                      style={buildTimeTextStyle(semana.horasEntregues, 1.0625)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mt-auto" style={{ overflow: 'visible' }}>
              {item.variacoes.map((variacao) => (
                <div
                  key={variacao.label}
                  className="rounded-[7px] bg-white border border-slate-200 px-2 py-2 text-center flex flex-col items-center justify-center gap-0.5"
                  style={{ overflow: 'visible' }}
                >
                  <p className="text-[12px] font-medium text-slate-500 leading-tight">{variacao.label}</p>
                  <p
                    className={`font-bold leading-tight ${variacao.positivo ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    style={buildTimeTextStyle(variacao.valor, 0.9375)}
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

