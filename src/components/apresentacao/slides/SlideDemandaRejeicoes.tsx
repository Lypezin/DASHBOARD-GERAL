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
    <SlideWrapper isVisible={isVisible} style={{ padding: '32px 40px' }}>
      {/* Header */}
      <header className="text-center mb-5">
        <div className="inline-block">
          <h2 className="text-[2rem] font-black tracking-wider text-blue-600 leading-none">
            DEMANDA E REJEIÇÕES
          </h2>
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
        </div>
        <p className="text-[1.125rem] font-light text-slate-500 mt-2">
          Comparativo Semanas {numeroSemana1} vs {numeroSemana2}
        </p>
      </header>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-3 gap-5 flex-1">
        {/* Week 1 Column */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[1.25rem] font-bold text-center mb-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-800">
            SEMANA {numeroSemana1}
          </h3>
          <div className="space-y-2 flex-1">
            {itens.map((item) => (
              <div
                key={`sem1-${item.label}`}
                className="flex flex-col rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 px-4 py-3 shadow-sm"
              >
                <span className="text-[0.875rem] font-semibold text-slate-500 mb-1 text-center">
                  {item.label}
                </span>
                <span className="text-[1.75rem] font-black text-blue-600 text-center">{item.semana1Valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Variations Column */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[1.25rem] font-bold text-center mb-2 px-4 py-2 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-lg text-slate-800">
            VARIAÇÕES
          </h3>
          <div className="space-y-2 flex-1">
            {itens.map((item) => (
              <div
                key={`var-${item.label}`}
                className={`flex flex-col rounded-xl border px-4 py-3 shadow-sm ${item.variacaoPositiva
                    ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200'
                    : 'bg-gradient-to-r from-rose-50 to-white border-rose-200'
                  }`}
              >
                <span className="text-[0.75rem] text-slate-500 mb-1 text-center font-medium">
                  {item.label}
                </span>

                {/* Variation value with arrow */}
                <div className={`flex items-center justify-center gap-1 ${item.variacaoPositiva ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                  {item.variacaoPositiva ? (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 20l8-8h-5V4H9v8H4z" />
                    </svg>
                  )}
                  <span className="text-[1.375rem] font-black">
                    {item.variacaoValor}
                  </span>
                </div>

                {/* Percentage badge */}
                <div className={`mt-1 inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-full text-[0.875rem] font-bold mx-auto ${item.variacaoPercentualPositiva
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                  }`}>
                  {item.variacaoPercentualPositiva ? (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 20l8-8h-5V4H9v8H4z" />
                    </svg>
                  )}
                  {item.variacaoPercentual}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Week 2 Column */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[1.25rem] font-bold text-center mb-2 px-4 py-2 bg-blue-600 rounded-lg text-white">
            SEMANA {numeroSemana2}
          </h3>
          <div className="space-y-2 flex-1">
            {itens.map((item) => (
              <div
                key={`sem2-${item.label}`}
                className="flex flex-col rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-200 px-4 py-3 shadow-sm"
              >
                <span className="text-[0.875rem] font-semibold text-slate-500 mb-1 text-center">
                  {item.label}
                </span>
                <span className="text-[1.75rem] font-black text-blue-600 text-center">{item.semana2Valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideDemandaRejeicoes;
