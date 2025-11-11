import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildCircleTextStyle, buildTimeTextStyle } from '../utils';

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
  const circumference = 2 * Math.PI * 73; // r = 73 (ajustado para container maior)
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
    <SlideWrapper isVisible={isVisible} style={{ padding: '35px 45px', overflow: 'visible' }}>
      <header className="text-center mb-5">
        <h2 className="text-[2.5rem] font-black leading-none tracking-wider mb-1.5">ADERÊNCIA POR TURNO</h2>
        <p className="text-[1.5rem] font-light opacity-90 mb-1">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[1rem] font-medium opacity-75">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-5 flex-1" style={{ overflow: 'visible' }}>
        {itens.map((turno) => (
          <div
            key={turno.nome}
            className="rounded-[16px] bg-white/15 px-5 py-5 flex flex-col gap-4"
            style={{ overflow: 'visible' }}
          >
            <div className="text-center" style={{ overflow: 'visible' }}>
              <h3 className="text-[26px] font-semibold uppercase tracking-wide leading-tight">{turno.nome}</h3>
            </div>

            <div className="flex items-center justify-between gap-4" style={{ overflow: 'visible' }}>
              {[turno.semana1, turno.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-3 flex-1" style={{ overflow: 'visible' }}>
                  <span className="text-[18px] font-bold text-center opacity-90">
                    SEMANA {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div 
                    className="relative flex items-center justify-center"
                    style={{ 
                      width: '160px', 
                      height: '160px',
                      overflow: 'visible',
                    }}
                  >
                    <svg
                      className="absolute inset-0"
                      viewBox="0 0 160 160"
                      style={{ transform: 'rotate(-90deg)' }}
                    >
                      <circle cx="80" cy="80" r="73" stroke="rgba(255,255,255,0.25)" strokeWidth="14" fill="none" />
                      <circle
                        cx="80"
                        cy="80"
                        r="73"
                        stroke="#ffffff"
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span 
                      style={buildCircleTextStyle(semana.aderencia, 1.8, 1.0)}
                      className="flex items-center justify-center w-full h-full text-center"
                    >
                      {semana.aderencia.toFixed(1)}%
                    </span>
                  </div>
                  <div className="rounded-[10px] bg-white/10 px-3 py-2.5 w-full flex flex-col items-center gap-1" style={{ overflow: 'visible' }}>
                    <span className="text-[15px] font-medium opacity-90">Horas Entregues</span>
                    <span
                      className="font-bold text-emerald-200 text-center"
                      style={buildTimeTextStyle(semana.horasEntregues, 1.25)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-auto" style={{ overflow: 'visible' }}>
              {turno.variacoes.map((variacao) => (
                <div key={variacao.label} className="rounded-[8px] bg-white/10 px-3 py-2.5 text-center flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <p className="text-[14px] font-medium opacity-80 leading-tight">{variacao.label}</p>
                  <p
                    className={`font-bold leading-tight ${variacao.positivo ? 'text-emerald-200' : 'text-rose-200'}`}
                    style={buildTimeTextStyle(variacao.valor, 1.0625)}
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

