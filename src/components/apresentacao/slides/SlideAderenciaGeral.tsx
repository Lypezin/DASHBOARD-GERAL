import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';
import { SemanaCard } from './SemanaCard';

interface SemanaResumo {
  numeroSemana: string;
  aderencia: number;
  horasPlanejadas: string;
  horasEntregues: string;
}

interface VariacaoResumo {
  horasDiferenca: string;
  horasPercentual: string;
  positiva: boolean;
}

interface SlideAderenciaGeralProps {
  isVisible: boolean;
  semana1: SemanaResumo;
  semana2: SemanaResumo;
  variacao: VariacaoResumo;
}

const SlideAderenciaGeral: React.FC<SlideAderenciaGeralProps> = React.memo(({
  isVisible,
  semana1,
  semana2,
  variacao,
}) => {
  if (!semana1 || !semana2 || !variacao) {
    return null;
  }

  return (
    <SlideWrapper
      isVisible={isVisible}
      className="flex flex-col items-center justify-center"
      style={{ padding: '32px 48px' }}
    >
      {/* Header */}
      <header className="text-center mb-8">
        <div className="inline-block">
          <h2 className="text-[2.75rem] font-black tracking-wider text-blue-600 leading-none">
            ADERÊNCIA GERAL
          </h2>
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-3" />
        </div>
        <p className="text-[1.25rem] font-light text-slate-500 mt-3">
          Comparativo Semanas {semana1.numeroSemana} vs {semana2.numeroSemana}
        </p>
      </header>

      {/* Main content - flex container for weeks */}
      <div className="flex w-full justify-center items-center gap-12 flex-1">
        {/* Semana 1 */}
        <SemanaCard semana={semana1} />

        {/* Central variation column */}
        <div className="flex flex-col items-center justify-center">
          <div className={`rounded-xl border-2 px-8 py-5 text-center flex flex-col items-center gap-3 shadow-lg ${variacao.positiva
            ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-emerald-300'
            : 'bg-gradient-to-b from-rose-50 to-rose-100 border-rose-300'
            }`}>
            <p className="text-[1.1rem] font-semibold text-slate-600 uppercase tracking-wide">Variação</p>

            {/* Arrow and difference */}
            <div className={`flex items-center gap-2 ${variacao.positiva ? 'text-emerald-600' : 'text-rose-600'}`}>
              {variacao.positiva ? (
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              ) : (
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              )}
              <span className="font-black" style={buildTimeTextStyle(variacao.horasDiferenca, 1.75)}>
                {variacao.horasDiferenca}
              </span>
            </div>

            {/* Percentage */}
            <div className={`flex items-center gap-1 px-4 py-1.5 rounded-full ${variacao.positiva ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'
              }`}>
              {variacao.positiva ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              )}
              <span className="text-[1.25rem] font-bold">
                {variacao.horasPercentual}
              </span>
            </div>
          </div>
        </div>

        {/* Semana 2 */}
        <SemanaCard semana={semana2} />
      </div>
    </SlideWrapper>
  );
});

SlideAderenciaGeral.displayName = 'SlideAderenciaGeral';

export default SlideAderenciaGeral;
