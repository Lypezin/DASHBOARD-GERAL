
import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { MetricCard } from './components/MetricCard';
import { VariationCard } from './components/VariationCard';

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

      <div className="flex-1 flex flex-col justify-center w-full max-w-5xl mx-auto gap-6">
        {/* Headers Row */}
        <div className="grid grid-cols-3 gap-6">
          <h3 className="text-xl font-bold text-center px-5 py-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-800 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 uppercase tracking-wide">
            SEMANA {numeroSemana1}
          </h3>
          <h3 className="text-xl font-bold text-center px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 uppercase tracking-wide">
            VARIAÇÕES
          </h3>
          <h3 className="text-xl font-bold text-center px-5 py-2.5 bg-blue-600 dark:bg-blue-700 rounded-xl text-white shadow-md uppercase tracking-wide border border-blue-700 dark:border-blue-800">
            SEMANA {numeroSemana2}
          </h3>
        </div>

        {/* Content Rows */}
        <div className="flex flex-col gap-4">
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
