import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';

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

const buildCircleDasharray = (valor: number, radius: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * radius;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Variation badge component
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`flex-1 rounded-lg py-2 px-2 text-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
    <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wide mb-1 leading-tight">{label}</p>
    <div className={`flex items-center justify-center gap-1 font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positive ? (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span className="text-base leading-none" style={buildTimeTextStyle(value, 1)}>{value}</span>
    </div>
  </div>
);

// Week circle with hours
const WeekCircle: React.FC<{
  semana: TurnoResumo;
  label: string;
  isSecond: boolean;
  size?: 'normal' | 'large';
}> = ({ semana, label, isSecond, size = 'normal' }) => {
  const circleSize = size === 'large' ? 'w-[120px] h-[120px]' : 'w-[100px] h-[100px]';
  const fontSize = size === 'large' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex flex-col items-center gap-3">
      <span className={`text-sm font-bold px-5 py-1.5 rounded-full ${isSecond ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
        {label}
      </span>

      {/* Progress Circle */}
      <div className={`relative ${circleSize} animate-scale-in`}>
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
          <span className={`text-slate-900 font-black ${fontSize} leading-none tracking-tight`}>
            {semana.aderencia.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Hours */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-center min-w-[110px]">
        <span className="text-[0.65rem] font-semibold text-emerald-600 uppercase block">Entregue</span>
        <span className="font-bold text-emerald-700 block text-lg" style={buildTimeTextStyle(semana.horasEntregues, 1.125)}>
          {semana.horasEntregues}
        </span>
      </div>
    </div>
  );
};

const SlideTurnos: React.FC<SlideTurnosProps> = ({
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
            ADERÊNCIA POR TURNO
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

      {/* Cards Grid - 2 columns or centered single */}
      <div className={`${isSingleItem ? 'flex justify-center items-center' : 'grid grid-cols-2 gap-8'} flex-1 content-start`}>
        {itens.map((turno) => (
          <div
            key={turno.nome}
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg ${isSingleItem ? 'w-full max-w-7xl mx-auto' : ''}`}
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 min-h-[4.5rem] flex items-center justify-center">
              <h3
                className="text-white font-bold text-lg uppercase tracking-wide text-center leading-snug"
                style={{
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
                title={turno.nome}
              >
                {turno.nome}
              </h3>
            </div>

            {/* Card Body */}
            <div className={isSingleItem ? 'p-10' : 'p-6'}>
              {/* Week Comparison */}
              <div className={`flex items-center justify-center ${isSingleItem ? 'gap-16' : 'gap-10'} mb-6`}>
                <WeekCircle
                  semana={turno.semana1}
                  label={`SEM ${numeroSemana1}`}
                  isSecond={false}
                  size={isSingleItem ? 'large' : 'normal'}
                />
                <WeekCircle
                  semana={turno.semana2}
                  label={`SEM ${numeroSemana2}`}
                  isSecond={true}
                  size={isSingleItem ? 'large' : 'normal'}
                />
              </div>

              {/* Variations Row */}
              <div className="flex gap-3">
                {turno.variacoes.map((variacao) => (
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

export default SlideTurnos;
