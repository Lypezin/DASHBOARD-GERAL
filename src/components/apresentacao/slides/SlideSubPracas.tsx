import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';

interface SemanaResumo {
  aderencia: number;
  horasEntregues: string;
}

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface SubPracaComparativo {
  nome: string;
  horasPlanejadas: string;
  semana1: SemanaResumo;
  semana2: SemanaResumo;
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

const buildCircleDasharray = (valor: number, radius: number) => {
  const clamped = Math.max(0, Math.min(100, valor));
  const circumference = 2 * Math.PI * radius;
  return `${(clamped / 100) * circumference} ${circumference}`;
};

// Compact variation badge for inline use
const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
  <div className={`flex-1 rounded-lg py-2 px-1 text-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
    <p className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
    <div className={`flex items-center justify-center gap-0.5 font-bold text-sm ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positive ? (
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span style={buildTimeTextStyle(value, 0.85)}>{value}</span>
    </div>
  </div>
);

// Week comparison component with circle and hours
const WeekCircle: React.FC<{
  semana: SemanaResumo;
  label: string;
  isSecond: boolean;
}> = ({ semana, label, isSecond }) => (
  <div className="flex flex-col items-center gap-2">
    <span className={`text-xs font-bold px-4 py-1 rounded-full ${isSecond ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
      {label}
    </span>

    {/* Progress Circle */}
    <div className="relative w-[90px] h-[90px]">
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
        <span className="text-slate-900 font-black text-xl leading-none">
          {semana.aderencia.toFixed(1)}%
        </span>
      </div>
    </div>

    {/* Hours */}
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center min-w-[100px]">
      <span className="text-[0.6rem] font-medium text-emerald-700 uppercase block">Entregue</span>
      <span className="font-bold text-emerald-600 block" style={buildTimeTextStyle(semana.horasEntregues, 0.9)}>
        {semana.horasEntregues}
      </span>
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
    <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
      {/* Header */}
      <header className="text-center mb-6">
        <div className="inline-block">
          <h2 className="text-[2.5rem] font-black tracking-wider text-blue-600 leading-none">
            SUB-PRAÇAS
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

      {/* Cards Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-6 flex-1 content-center">
        {itens.map((item) => (
          <div
            key={item.nome}
            className="rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg overflow-hidden"
          >
            {/* Card Header - Full width with name and planned */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3 flex items-center justify-between gap-4">
              <h3
                className="text-white font-bold text-base uppercase tracking-wide flex-1"
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
              <div className="bg-blue-500 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                <span className="text-[0.6rem] font-medium text-blue-100 block uppercase">Planejado</span>
                <span className="text-white font-bold" style={buildTimeTextStyle(item.horasPlanejadas, 0.85)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              {/* Week Comparison */}
              <div className="flex items-center justify-center gap-8 mb-4">
                <WeekCircle
                  semana={item.semana1}
                  label={`SEM ${numeroSemana1}`}
                  isSecond={false}
                />
                <WeekCircle
                  semana={item.semana2}
                  label={`SEM ${numeroSemana2}`}
                  isSecond={true}
                />
              </div>

              {/* Variations Row */}
              <div className="flex gap-2">
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

export default SlideSubPracas;
