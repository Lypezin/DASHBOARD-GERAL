import React from 'react';
import SlideWrapper from '../SlideWrapper';

interface TurnoResumo {
  aderencia: number;
  horasEntregues: string;
}

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface TurnoComparativo {
  nome: string;
  semana1: TurnoResumo;
  semana2: TurnoResumo;
  variacoes: VariacaoResumo[];
}

interface SlideTurnosProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: TurnoComparativo[];
}

const buildCircleDasharray = (valor: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * 100; // r = 100
  return `${(clamped / 100) * circumference} ${circumference}`;
};

const SlideTurnos: React.FC<SlideTurnosProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '110px 120px' }}>
      <header className="text-center mb-16">
        <h2 className="text-[8.5rem] font-black leading-none tracking-wider mb-6">ADERÊNCIA POR TURNO</h2>
        <p className="text-[4.8rem] font-light opacity-90 mb-4">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[3rem] font-medium opacity-75">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-3 gap-10 flex-1">
        {itens.map((turno) => (
          <div
            key={turno.nome}
            className="rounded-[42px] bg-white/12 px-10 py-12 flex flex-col gap-10"
          >
            <div className="text-center space-y-2">
              <h3 className="text-[4rem] font-semibold uppercase tracking-wide">{turno.nome}</h3>
            </div>

            <div className="flex items-center justify-between gap-10">
              {[turno.semana1, turno.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-6">
                  <span className="text-[2.6rem] font-medium">
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div className="relative w-[260px] h-[260px]">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 260 260"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <circle cx="130" cy="130" r="100" stroke="rgba(255,255,255,0.2)" strokeWidth="26" fill="none" />
                      <circle
                        cx="130"
                        cy="130"
                        r="100"
                        stroke="#ffffff"
                        strokeWidth="26"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[4.8rem] font-black leading-none">
                        {semana.aderencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[3rem] font-semibold text-emerald-100">
                    {semana.horasEntregues}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {turno.variacoes.map((variacao) => (
                <div key={variacao.label} className="rounded-2xl bg-white/10 px-6 py-5 text-center">
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

export default SlideTurnos;

