import React from 'react';
import SlideWrapper from '../SlideWrapper';

interface DemandaMetric {
  label: string;
  icone: string;
  semana1Valor: string;
  semana2Valor: string;
  variacaoValor: string;
  variacaoPositiva: boolean;
  variacaoPercentual: string;
  variacaoPercentualPositiva: boolean;
}

interface SlideDemandaRejeicoesProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  itens: DemandaMetric[];
}

// Metric card component
const MetricCard: React.FC<{
  label: string;
  value: string;
  variant: 'week1' | 'week2';
}> = ({ label, value, variant }) => (
  <div className={`rounded-xl px-5 py-4 flex flex-col items-center shadow-sm ${variant === 'week2'
      ? 'bg-gradient-to-br from-blue-50 to-white border border-blue-200'
      : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200'
    }`}>
    <span className="text-sm font-semibold text-slate-500 mb-1.5 text-center">
      {label}
    </span>
    <span className={`text-3xl font-black ${variant === 'week2' ? 'text-blue-600' : 'text-slate-700'}`}>
      {value}
    </span>
  </div>
);

// Variation card component
const VariationCard: React.FC<{
  label: string;
  value: string;
  positive: boolean;
  percentual: string;
  percentualPositiva: boolean;
}> = ({ label, value, positive, percentual, percentualPositiva }) => (
  <div className={`rounded-xl px-5 py-4 flex flex-col items-center shadow-md ${positive
      ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-300'
      : 'bg-gradient-to-br from-rose-50 via-rose-100 to-white border border-rose-300'
    }`}>
    <span className="text-sm font-semibold text-slate-500 mb-1.5 text-center">
      {label}
    </span>

    {/* Variation value with arrow */}
    <div className={`flex items-center gap-1.5 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positive ? (
        <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      <span className="text-2xl font-black">{value}</span>
    </div>

    {/* Percentage badge */}
    <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${percentualPositiva
        ? 'bg-emerald-200 text-emerald-800'
        : 'bg-rose-200 text-rose-800'
      }`}>
      {percentualPositiva ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      )}
      {percentual}
    </div>
  </div>
);

const SlideDemandaRejeicoes: React.FC<SlideDemandaRejeicoesProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  itens,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
      {/* Header */}
      <header className="text-center mb-6">
        <div className="inline-block">
          <h2 className="text-[2.5rem] font-black tracking-wider text-blue-600 leading-none">
            DEMANDA E REJEIÇÕES
          </h2>
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
        </div>
        <p className="text-lg font-light text-slate-500 mt-2">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
      </header>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-3 gap-6 flex-1">
        {/* Week 1 Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-center mb-1 px-5 py-2.5 bg-slate-100 rounded-xl text-slate-800 border border-slate-200">
            SEMANA {numeroSemana1}
          </h3>
          <div className="space-y-3 flex-1">
            {itens.map((item) => (
              <MetricCard
                key={`sem1-${item.label}`}
                label={item.label}
                value={item.semana1Valor}
                variant="week1"
              />
            ))}
          </div>
        </div>

        {/* Variations Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-center mb-1 px-5 py-2.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl text-slate-800 border border-slate-200">
            VARIAÇÕES
          </h3>
          <div className="space-y-3 flex-1">
            {itens.map((item) => (
              <VariationCard
                key={`var-${item.label}`}
                label={item.label}
                value={item.variacaoValor}
                positive={item.variacaoPositiva}
                percentual={item.variacaoPercentual}
                percentualPositiva={item.variacaoPercentualPositiva}
              />
            ))}
          </div>
        </div>

        {/* Week 2 Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-center mb-1 px-5 py-2.5 bg-blue-600 rounded-xl text-white shadow-md">
            SEMANA {numeroSemana2}
          </h3>
          <div className="space-y-3 flex-1">
            {itens.map((item) => (
              <MetricCard
                key={`sem2-${item.label}`}
                label={item.label}
                value={item.semana2Valor}
                variant="week2"
              />
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideDemandaRejeicoes;
