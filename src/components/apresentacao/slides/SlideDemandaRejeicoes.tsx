
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
