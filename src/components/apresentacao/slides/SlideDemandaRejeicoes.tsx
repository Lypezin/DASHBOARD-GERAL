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

const SlideDemandaRejeicoes: React.FC<SlideDemandaRejeicoesProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  itens,
}) => {
  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '110px 130px' }}>
      <header className="text-center mb-[72px]">
        <h2 className="text-[7.5rem] font-black leading-none tracking-wider mb-6">
          DEMANDA E REJEIÇÕES
        </h2>
        <p className="text-[4.6rem] font-light opacity-90">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-12 flex-1 items-start">
        <div className="space-y-8">
          <h3 className="text-[4.5rem] font-semibold text-center mb-4">SEMANA {numeroSemana1}</h3>
          <div className="space-y-6">
            {itens.map((item) => (
              <div
                key={`sem1-${item.label}`}
                className="flex items-center justify-between rounded-[36px] bg-white/12 px-12 py-8"
              >
                <span className="text-[3.6rem] font-semibold opacity-85">
                  {item.icone} {item.label}:
                </span>
                <span className="text-[5rem] font-black text-blue-100">{item.semana1Valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-[4.5rem] font-semibold text-center mb-4">SEMANA {numeroSemana2}</h3>
          <div className="space-y-6">
            {itens.map((item) => (
              <div
                key={`sem2-${item.label}`}
                className="rounded-[36px] bg-white/12 px-12 py-8"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[3.6rem] font-semibold opacity-85">
                    {item.icone} {item.label}:
                  </span>
                  <span className="text-[5rem] font-black text-blue-100">{item.semana2Valor}</span>
                </div>
                <div className="mt-4 flex items-end justify-end gap-6">
                  <span
                    className={`text-[3rem] font-bold ${
                      item.variacaoPositiva ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                  >
                    {item.variacaoValor}
                  </span>
                  <span
                    className={`text-[2.6rem] font-semibold ${
                      item.variacaoPercentualPositiva ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                  >
                    {item.variacaoPercentual}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideDemandaRejeicoes;

