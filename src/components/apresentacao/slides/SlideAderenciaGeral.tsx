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
      style={{ padding: '24px 40px' }}
    >
      {/* Header - smaller to give more space to content */}
      <header className="text-center mb-6">
        <div className="inline-block">
          <h2 className="text-[3rem] font-black tracking-wider text-blue-600 leading-none">
            ADERÊNCIA GERAL
          </h2>
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-3" />
        </div>
        <p className="text-xl font-light text-slate-500 mt-2">
          Comparativo Semanas {semana1.numeroSemana} vs {semana2.numeroSemana}
        </p>
      </header>

      {/* Main content - use more vertical space */}
      <div className="flex w-full justify-center items-center gap-16 flex-1">
        {/* Semana 1 */}
        <SemanaCard semana={semana1} />

        {/* Central variation column */}
        <div className="flex flex-col items-center justify-center">
          <div className={`rounded-xl border-2 px-10 py-6 text-center flex flex-col items-center gap-4 shadow-lg ${variacao.positiva
            ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-emerald-300'
            : 'bg-gradient-to-b from-rose-50 to-rose-100 border-rose-300'
            }`}>
            <p className="text-xl font-semibold text-slate-600 uppercase tracking-wide">Variação</p>

            {/* Arrow and difference */}
            <div className={`flex items-center gap-3 ${variacao.positiva ? 'text-emerald-600' : 'text-rose-600'}`}>
              {variacao.positiva ? (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              ) : (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              )}
              <span className="font-black" style={buildTimeTextStyle(variacao.horasDiferenca, 2)}>
                {variacao.horasDiferenca}
              </span>
            </div>

            {/* Percentage */}
            <div className={`flex items-center gap-2 px-5 py-2 rounded-full ${variacao.positiva ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'
              }`}>
              {variacao.positiva ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              )}
              <span className="text-2xl font-bold">
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
