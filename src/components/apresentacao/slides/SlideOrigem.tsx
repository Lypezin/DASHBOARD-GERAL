import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';

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

const buildCircleDasharray = (valor: number, radius: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * radius;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Variation badge component - ultra compact
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`flex-1 rounded-lg py-1.5 px-1.5 text-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
    <p className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-wide mb-1 leading-tight">{label}</p>
    <div className={`flex items-center justify-center gap-1 font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positive ? (
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span className="text-sm leading-none" style={buildTimeTextStyle(value, 0.85)}>{value}</span>
    </div>
  </div>
);

// Week display component
const WeekDisplay: React.FC<{
  semana: { aderencia: number; horasEntregues: string };
  label: string;
  isSecond: boolean;
  size?: 'normal' | 'large';
}> = ({ semana, label, isSecond, size = 'normal' }) => {
  const circleSize = size === 'large' ? 'w-[110px] h-[110px]' : 'w-[90px] h-[90px]';
  const fontSize = size === 'large' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${isSecond ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
        {label}
      </span>

      {/* Progress Circle */}
      <div className={`relative ${circleSize}`}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={isSecond ? "#2563eb" : "#64748b"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={buildCircleDasharray(semana.aderencia, 40)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-slate-900 font-black ${fontSize} leading-none`}>
            {semana.aderencia.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Hours */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center min-w-[110px]">
        <span className="text-[0.6rem] font-semibold text-emerald-600 uppercase block">Entregue</span>
        <span className="font-bold text-emerald-700 block text-base" style={buildTimeTextStyle(semana.horasEntregues, 1)}>
          {semana.horasEntregues}
        </span>
      </div>
    </div>
  );
};

const SlideOrigem: React.FC<SlideOrigemProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  const isSingleItem = itens.length === 1;

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '28px 48px' }}>
      {/* Header */}
      <header className="text-center mb-6">
        <div className="inline-block">
          <h2 className="text-[2.5rem] font-black tracking-wider text-blue-600 leading-none">
            ORIGENS
          </h2>
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
        </div>
        <p className="text-lg font-light text-slate-500 mt-2">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
        {totalPaginas > 1 && (
          <p className="text-base font-medium text-slate-400 mt-1">
            Página {paginaAtual} de {totalPaginas}
          </p>
        )}
      </header>

      {/* Cards Grid - responsive based on count */}
      <div className={`${isSingleItem ? 'flex justify-center items-center' : 'grid grid-cols-3 gap-6'} flex-1 content-center`}>
        {itens.map((item) => (
          <div
            key={item.nome}
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg overflow-hidden ${isSingleItem ? 'w-[700px]' : ''}`}
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-3.5 flex items-center justify-between gap-3">
              <h3
                className="text-white font-bold text-lg uppercase tracking-wide flex-1"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title={item.nome}
              >
                {item.nome}
              </h3>
              <div className="bg-blue-500 rounded-lg px-4 py-1.5 text-center flex-shrink-0">
                <span className="text-[0.6rem] font-medium text-blue-100 block">Planejado</span>
                <span className="text-white font-bold text-base" style={buildTimeTextStyle(item.horasPlanejadas, 1)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className={isSingleItem ? 'p-8' : 'p-5'}>
              {/* Week Comparison */}
              <div className={`flex items-center justify-center ${isSingleItem ? 'gap-12' : 'gap-6'} mb-5`}>
                <WeekDisplay
                  semana={item.semana1}
                  label={`SEM ${numeroSemana1}`}
                  isSecond={false}
                  size={isSingleItem ? 'large' : 'normal'}
                />
                <WeekDisplay
                  semana={item.semana2}
                  label={`SEM ${numeroSemana2}`}
                  isSecond={true}
                  size={isSingleItem ? 'large' : 'normal'}
                />
              </div>

              {/* Variations Row */}
              <div className="flex gap-2.5">
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
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
};

export default SlideOrigem;
