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
  const circumference = 2 * Math.PI * 85; // r = 85 (reduzido para dar espaço ao texto)
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
    <SlideWrapper isVisible={isVisible} style={{ padding: '80px 100px' }}>
      <header className="text-center mb-12">
        <h2 className="text-[6rem] font-black leading-none tracking-wider mb-4">ADERÊNCIA POR TURNO</h2>
        <p className="text-[3.5rem] font-light opacity-90 mb-3">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[2.2rem] font-medium opacity-75">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-3 gap-8 flex-1">
        {itens.map((turno) => (
          <div
            key={turno.nome}
            className="rounded-[32px] bg-white/12 px-8 py-10 flex flex-col gap-8"
          >
            <div className="text-center">
              <h3 className="text-[2.8rem] font-semibold uppercase tracking-wide leading-tight">{turno.nome}</h3>
            </div>

            <div className="flex items-center justify-between gap-8">
              {[turno.semana1, turno.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-4 flex-1">
                  <span className="text-[2rem] font-medium">
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div className="relative w-[200px] h-[200px]">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 200 200"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      <circle cx="100" cy="100" r="85" stroke="rgba(255,255,255,0.2)" strokeWidth="20" fill="none" />
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        stroke="#ffffff"
                        strokeWidth="20"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <span className="text-[3.2rem] font-black leading-none" style={{ lineHeight: '1', letterSpacing: '0' }}>
                        {semana.aderencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[2rem] font-semibold text-emerald-100 text-center">
                    {semana.horasEntregues}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {turno.variacoes.map((variacao) => (
                <div key={variacao.label} className="rounded-xl bg-white/10 px-4 py-4 text-center">
                  <p className="text-[1.6rem] font-medium opacity-80 mb-1">{variacao.label}</p>
                  <p
                    className={`text-[1.8rem] font-bold leading-tight break-words ${variacao.positivo ? 'text-emerald-200' : 'text-rose-200'}`}
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
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

