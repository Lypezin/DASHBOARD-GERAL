import React from 'react';
import SlideWrapper from '../SlideWrapper';

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface SubPracaComparativo {
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

interface SlideSubPracasProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: SubPracaComparativo[];
}

const buildCircleDasharray = (valor: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * 120; // r = 120
  return `${(clamped / 100) * circumference} ${circumference}`;
};

const SlideSubPracas: React.FC<SlideSubPracasProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  return (
    <SlideWrapper
      isVisible={isVisible}
      style={{ padding: '110px 130px' }}
    >
      <header className="text-center mb-20">
        <h2 className="text-[8.5rem] font-black leading-none tracking-wider mb-6">SUB-PRAÇAS</h2>
        <p className="text-[4.8rem] font-light opacity-90 mb-4">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[3rem] font-medium opacity-75">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-x-16 gap-y-[72px] flex-1">
        {itens.map((item) => (
          <div
            key={item.nome}
            className="relative flex flex-col items-center gap-10 rounded-[48px] bg-white/12 px-14 py-12"
          >
            <div className="text-center space-y-4">
              <h3 className="text-[3.8rem] font-semibold uppercase tracking-wide leading-tight">
                {item.nome}
              </h3>
              <p className="text-[3rem] font-medium opacity-80">
                🎯 Planejado: <span className="font-bold text-blue-200">{item.horasPlanejadas}</span>
              </p>
            </div>

            <div className="flex w-full items-center justify-between gap-16">
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-6">
                  <span className="text-[2.8rem] font-semibold">
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div className="relative w-[320px] h-[320px]">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 320 320"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <circle cx="160" cy="160" r="120" stroke="rgba(255,255,255,0.2)" strokeWidth="28" fill="none" />
                      <circle
                        cx="160"
                        cy="160"
                        r="120"
                        stroke="#ffffff"
                        strokeWidth="28"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[5.4rem] font-black leading-none">
                        {semana.aderencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[2.6rem] font-semibold text-emerald-100">
                    {semana.horasEntregues}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 w-full pt-4">
              {item.variacoes.map((variacao) => (
                <div
                  key={variacao.label}
                  className="rounded-2xl bg-white/10 px-6 py-6 text-center"
                >
                  <p className="text-[2.4rem] font-medium opacity-80 mb-2">{variacao.label}</p>
                  <p
                    className={`text-[3rem] font-bold ${variacao.positivo ? 'text-emerald-200' : 'text-rose-200'}`}
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

export default SlideSubPracas;

