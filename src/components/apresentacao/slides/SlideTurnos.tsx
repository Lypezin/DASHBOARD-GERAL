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
                  <span className="text-[2rem] font-medium text-center">
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>
                  <div 
                    className="relative flex items-center justify-center"
                    style={{ 
                      width: '220px', 
                      height: '220px',
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
                      viewBox="0 0 160 160"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <circle cx="80" cy="80" r="73" stroke="rgba(255,255,255,0.25)" strokeWidth="12" fill="none" />
                      <circle
                        cx="80"
                        cy="80"
                        r="73"
                        stroke="#ffffff"
                        strokeWidth="12"
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
                          ...buildCircleTextStyle(semana.aderencia, 2.8, 1.8),
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
                      style={buildTimeTextStyle(semana.horasEntregues, 1.9)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {turno.variacoes.map((variacao) => (
                <div key={variacao.label} className="rounded-xl bg-white/10 px-4 py-4 text-center flex flex-col items-center justify-center min-h-[88px] gap-1">
                  <p className="text-[1.6rem] font-medium opacity-80 leading-tight">{variacao.label}</p>
                  <p
                    className={`font-bold leading-tight ${variacao.positivo ? 'text-emerald-200' : 'text-rose-200'}`}
                    style={buildTimeTextStyle(variacao.valor, 1.7)}
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

