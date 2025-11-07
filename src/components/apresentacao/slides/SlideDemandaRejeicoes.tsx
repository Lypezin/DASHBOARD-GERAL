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
    <SlideWrapper isVisible={isVisible} style={{ padding: '80px 100px' }}>
      <header className="text-center mb-12">
        <h2 className="text-[6rem] font-black leading-none tracking-wider mb-4">
          DEMANDA E REJEIÇÕES
        </h2>
        <p className="text-[3.5rem] font-light opacity-90">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-10 flex-1 items-start">
        <div className="space-y-6">
          <h3 className="text-[3.2rem] font-semibold text-center mb-4">SEMANA {numeroSemana1}</h3>
          <div className="space-y-5">
            {itens.map((item) => (
              <div
                key={`sem1-${item.label}`}
                className="flex items-center justify-between rounded-[28px] bg-white/12 px-10 py-7"
              >
                <span className="text-[2.6rem] font-semibold opacity-85">
                  {item.icone} {item.label}:
                </span>
                <span className="text-[3.6rem] font-black text-blue-100">{item.semana1Valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[3.2rem] font-semibold text-center mb-4">SEMANA {numeroSemana2}</h3>
          <div className="space-y-5">
            {itens.map((item) => (
              <div
                key={`sem2-${item.label}`}
                className="rounded-[28px] bg-white/12 px-10 py-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[2.6rem] font-semibold opacity-85">
                    {item.icone} {item.label}:
                  </span>
                  <span className="text-[3.6rem] font-black text-blue-100">{item.semana2Valor}</span>
                </div>
                <div className="mt-3 flex items-end justify-end gap-5">
                  <span
                    className={`text-[2.4rem] font-bold ${
                      item.variacaoPositiva ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                  >
                    {item.variacaoValor}
                  </span>
                  <span
                    className={`text-[2rem] font-semibold ${
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

