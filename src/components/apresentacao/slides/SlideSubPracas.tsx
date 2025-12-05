import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildCircleTextStyle, buildTimeTextStyle } from '../utils';

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
  const circumference = 2 * Math.PI * 70;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Arrow indicator component
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`rounded-lg px-2 py-1.5 text-center flex flex-col items-center justify-center gap-0.5 ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
    }`}>
    <p className="text-[0.625rem] font-medium text-slate-600 leading-tight">{label}</p>
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
    <SlideWrapper isVisible={isVisible} style={{ padding: '28px 36px' }}>
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
          <p className="text-[0.875rem] font-medium text-slate-400 mt-1">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {itens.map((item) => (
          <div
            key={item.nome}
            className="relative flex flex-col rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-3 shadow-sm"
          >
            {/* Header with name and planned hours */}
            <div className="text-center mb-3">
              <h3 className="text-[1.125rem] font-bold uppercase tracking-wide text-slate-800 mb-2">
                {item.nome}
              </h3>
              <div className="inline-block rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
                <span className="text-[0.75rem] font-medium text-blue-600 block">Planejado</span>
                <span className="text-[1rem] font-bold text-blue-700" style={buildTimeTextStyle(item.horasPlanejadas, 1)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Week comparison */}
            <div className="flex items-start justify-between gap-3 flex-1">
              {[item.semana1, item.semana2].map((semana, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <span className={`text-[0.75rem] font-bold text-center px-2 py-0.5 rounded-full ${index === 0 ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white'
                    }`}>
                    SEM {index === 0 ? numeroSemana1 : numeroSemana2}
                  </span>

                  {/* Progress circle */}
                  <div className="relative flex items-center justify-center" style={{ width: '100px', height: '100px' }}>
                    <svg className="absolute inset-0" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="80" cy="80" r="70" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#2563eb"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={buildCircleDasharray(semana.aderencia)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={buildCircleTextStyle(semana.aderencia, 1.2, 0.8)}
                      className="text-slate-900 font-black"
                    >
                      {semana.aderencia.toFixed(1)}%
                    </span>
                  </div>

                  {/* Hours delivered */}
                  <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5 w-full text-center">
                    <span className="text-[0.625rem] font-medium text-slate-500 block">Entregue</span>
                    <span
                      className="font-bold text-emerald-600"
                      style={buildTimeTextStyle(semana.horasEntregues, 0.875)}
                    >
                      {semana.horasEntregues}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Variations */}
            <div className="grid grid-cols-3 gap-1.5 mt-3">
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
