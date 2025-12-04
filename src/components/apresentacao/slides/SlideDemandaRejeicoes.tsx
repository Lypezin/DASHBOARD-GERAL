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
    <SlideWrapper isVisible={isVisible} style={{ padding: '40px 50px', overflow: 'visible' }}>
      <header className="text-center mb-5">
        <h2 className="text-[2.5rem] font-black leading-none tracking-wider mb-2 text-blue-600">
          DEMANDA E REJEIÇÕES
        </h2>
        <p className="text-[1.5rem] font-light text-slate-500">
          SEMANAS {numeroSemana1} &amp; {numeroSemana2}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 flex-1 items-start" style={{ overflow: 'visible' }}>
        <div className="space-y-3" style={{ overflow: 'visible' }}>
          <h3 className="text-[24px] font-bold text-center mb-2 text-slate-900">SEMANA {numeroSemana1}</h3>
          <div className="space-y-2.5">
            {itens.map((item) => (
              <div
                key={`sem1-${item.label}`}
                className="flex flex-col rounded-[10px] bg-slate-50 border border-slate-200 px-4 py-3"
                style={{ overflow: 'visible' }}
              >
                <span className="text-[16px] font-bold text-slate-500 mb-1 text-center">
                  {item.label}
                </span>
                <span className="text-[32px] font-bold text-blue-600 text-center">{item.semana1Valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3" style={{ overflow: 'visible' }}>
          <h3 className="text-[24px] font-bold text-center mb-2 text-slate-900">VARIAÇÕES</h3>
          <div className="space-y-2.5">
            {itens.map((item) => (
              <div
                key={`var-${item.label}`}
                className="flex flex-col rounded-[10px] bg-white border border-slate-200 px-4 py-3"
                style={{ overflow: 'visible' }}
              >
                <span className="text-[12px] text-slate-500 mb-1 text-center">
                  {item.label}
                </span>
                <span
                  className={`text-[24px] font-bold ${item.variacaoPositiva ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                >
                  {item.variacaoValor}
                </span>
                <span
                  className={`text-[18px] font-semibold ${item.variacaoPercentualPositiva ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                >
                  {item.variacaoPercentual}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3" style={{ overflow: 'visible' }}>
          <h3 className="text-[24px] font-bold text-center mb-2 text-slate-900">SEMANA {numeroSemana2}</h3>
          <div className="space-y-2.5">
            {itens.map((item) => (
              <div
                key={`sem2-${item.label}`}
                className="flex flex-col rounded-[10px] bg-slate-50 border border-slate-200 px-4 py-3"
                style={{ overflow: 'visible' }}
              >
                <span className="text-[16px] font-bold text-slate-500 mb-1 text-center">
                  {item.label}
                </span>
                <span className="text-[32px] font-bold text-blue-600 text-center">{item.semana2Valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideDemandaRejeicoes;

