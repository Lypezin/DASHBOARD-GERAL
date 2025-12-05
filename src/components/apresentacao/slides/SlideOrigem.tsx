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
  const circumference = 2 * Math.PI * 50; // Reduced radius from 55 to 50
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Arrow indicator component
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`rounded-lg px-1.5 py-0.5 text-center flex flex-col items-center justify-center gap-0.5 ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
    }`}>
    <p className="text-[0.5rem] font-medium text-slate-600 leading-tight">{label}</p>
    <div className={`flex items-center gap-0.5 font-bold text-[0.6rem] leading-tight ${positive ? 'text-emerald-600' : 'text-rose-600'
      }`}>
      {positive ? (
        <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span style={buildTimeTextStyle(value, 0.6)}>{value}</span>
    </div>
  </div>
);

const SlideOrigem: React.FC<SlideOrigemProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '20px 32px' }}>
      {/* Header */}
      <header className="text-center mb-3">
        <div className="inline-block">
          <h2 className="text-[1.75rem] font-black tracking-wider text-blue-600 leading-none">
            ORIGENS
          </h2>
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-1.5" />
        </div>
        <p className="text-[0.875rem] font-light text-slate-500 mt-1.5">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-[0.75rem] font-medium text-slate-400 mt-0.5">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      {/* Cards Grid - 3x2 for 6 items */}
      <div className="grid grid-cols-3 gap-3 flex-1 content-start">
        {itens.map((item) => (
          <div
            key={item.nome}
            className="rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-2 flex flex-col shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[0.8rem] font-bold uppercase tracking-wide text-slate-800 truncate max-w-[60%]">
                {item.nome}
              </h3>
              <div className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5">
                <span className="text-[0.5rem] font-medium text-blue-600 block leading-tight">Planejado</span>
                <span className="text-[0.7rem] font-bold text-blue-700 leading-tight" style={buildTimeTextStyle(item.horasPlanejadas, 0.7)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Week comparison */}
            <div className="flex items-start justify-between gap-1.5 flex-1">
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-1 flex-1">
                  <span className={`text-[0.6rem] font-bold text-center px-2 py-0.5 rounded-full ${index === 0 ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white'
                    }`}>
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>

                  {/* Progress circle */}
                  <div className="relative flex items-center justify-center" style={{ width: '70px', height: '70px' }}>
                    <svg className="absolute inset-0" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#2563eb"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={buildCircleTextStyle(semana.aderencia, 0.9, 0.65)}
                      className="text-slate-900 font-black"
                    >
                      {semana.aderencia.toFixed(1)}%
                    </span>
                  </div>

                  {/* Hours delivered */}
                  <div className="rounded bg-white border border-slate-200 px-1.5 py-0.5 w-full text-center">
                    <span className="text-[0.5rem] font-medium text-slate-500 block">Entregue</span>
                    <span
                      className="font-bold text-emerald-600"
                      style={buildTimeTextStyle(semana.horasEntregues, 0.7)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Variations */}
            <div className="grid grid-cols-3 gap-1 mt-1.5">
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

export default SlideOrigem;
