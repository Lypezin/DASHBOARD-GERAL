import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';

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

// Progress circle helper
const buildCircleDasharray = (valor: number, radius: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * radius;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Variation badge component
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`rounded-lg px-2 py-1.5 text-center flex flex-col items-center justify-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
    }`}>
    <p className="text-[0.6rem] font-medium text-slate-600 leading-tight">{label}</p>
    <div className={`flex items-center gap-0.5 font-bold text-[0.75rem] leading-tight ${positive ? 'text-emerald-600' : 'text-rose-600'
      }`}>
      {positive ? (
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span style={buildTimeTextStyle(value, 0.75)}>{value}</span>
    </div>
  </div>
);

const SlideSubPracas: React.FC<SlideSubPracasProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '24px 40px' }}>
      {/* Header */}
      <header className="text-center mb-4">
        <div className="inline-block">
          <h2 className="text-[2rem] font-black tracking-wider text-blue-600 leading-none">
            SUB-PRAÇAS
          </h2>
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
        </div>
        <p className="text-[1rem] font-light text-slate-500 mt-2">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[0.85rem] font-medium text-slate-400 mt-1">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      {/* Cards Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-4 flex-1 content-center">
        {itens.map((item) => (
          <div
            key={item.nome}
            className="flex flex-col rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
          >
            {/* Header with name and planned hours */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[1rem] font-bold uppercase tracking-wide text-slate-800 truncate max-w-[65%]">
                {item.nome}
              </h3>
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1">
                <span className="text-[0.65rem] font-medium text-blue-600 block leading-tight">Planejado</span>
                <span className="text-[0.9rem] font-bold text-blue-700 leading-tight" style={buildTimeTextStyle(item.horasPlanejadas, 0.9)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Week comparison - larger circles */}
            <div className="flex items-center justify-around gap-4 mb-3">
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className={`text-[0.7rem] font-bold text-center px-3 py-0.5 rounded-full ${index === 0 ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white'
                    }`}>
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>

                  {/* Progress circle - larger */}
                  <div className="relative w-[90px] h-[90px]">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="7" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#2563eb"
                        strokeWidth="7"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia, 42)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-slate-900 font-black text-[1rem] leading-none">
                        {semana.aderencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Hours delivered */}
                  <div className="rounded-lg bg-white border border-slate-200 px-2 py-1 w-full text-center">
                    <span className="text-[0.6rem] font-medium text-slate-500 block">Entregue</span>
                    <span
                      className="font-bold text-emerald-600 text-[0.85rem]"
                      style={buildTimeTextStyle(semana.horasEntregues, 0.85)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Variations */}
            <div className="grid grid-cols-3 gap-2">
              {item.variacoes.map((variacao) => (
                <VariationBadge
                  key={variacao.label}
                  label={variacao.label}
                  value={variacao.valor}
                  positive={variacao.positivo}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
};

export default SlideSubPracas;
