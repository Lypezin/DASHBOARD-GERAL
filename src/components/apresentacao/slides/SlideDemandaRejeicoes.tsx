import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';

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
  <div className={`rounded-xl px-5 py-4 flex flex-col items-center justify-center h-full shadow-sm ${variant === 'week2'
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
  <div className={`rounded-xl px-5 py-4 flex flex-col items-center justify-center h-full shadow-md ${positive
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

      <SlideHeader
        title="DEMANDA E REJEIÇÕES"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      <div className="flex flex-col gap-4 flex-1">
        {/* Headers Row */}
        <div className="grid grid-cols-3 gap-6">
          <h3 className="text-xl font-bold text-center px-5 py-2.5 bg-sky-50 rounded-xl text-sky-800 border border-sky-100 uppercase tracking-wide">
            SEMANA {numeroSemana1}
          </h3>
          <h3 className="text-xl font-bold text-center px-5 py-2.5 bg-slate-50 rounded-xl text-slate-500 border border-slate-100 uppercase tracking-wide">
            VARIAÇÕES
          </h3>
          <h3 className="text-xl font-bold text-center px-5 py-2.5 bg-blue-600 rounded-xl text-white shadow-md uppercase tracking-wide border border-blue-700">
            SEMANA {numeroSemana2}
          </h3>
        </div>

        {/* Content Rows */}
        <div className="flex flex-col gap-3 flex-1 justify-center">
          {itens.map((item) => (
            <div key={item.label} className="grid grid-cols-3 gap-6">
              <MetricCard
                label={item.label}
                value={item.semana1Valor}
                variant="week1"
              />
              <VariationCard
                label={item.label}
                value={item.variacaoValor}
                positive={item.variacaoPositiva}
                percentual={item.variacaoPercentual}
                percentualPositiva={item.variacaoPercentualPositiva}
              />
              <MetricCard
                label={item.label}
                value={item.semana2Valor}
                variant="week2"
              />
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideDemandaRejeicoes;
