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
          <h2 className="text-[3.5rem] font-black tracking-wider text-blue-600 leading-none">
            ADERÊNCIA GERAL
          </h2>
          <div className="h-2 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-3" />
        </div>
        <p className="text-xl font-light text-slate-500 mt-3">
          Comparativo Semanas {semana1.numeroSemana} vs {semana2.numeroSemana}
        </p>
      </header>

      {/* Main content */}
      <div className="flex w-full justify-evenly items-center gap-4 flex-1 px-8">
        {/* Semana 1 */}
        <SemanaCard semana={semana1} isHighlighted={false} isActive={isVisible} />

        {/* Central variation box */}
        <div className="flex flex-col items-center justify-center">
          <div className={`rounded-2xl border-2 px-12 py-10 text-center flex flex-col items-center gap-8 shadow-xl ${variacao.positiva
            ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-300'
            : 'bg-gradient-to-br from-rose-50 via-rose-100 to-rose-50 border-rose-300'
            }`}>

            <p className="text-xl font-bold text-slate-600 uppercase tracking-widest">Variação</p>

            {/* Arrow and difference */}
            <div className={`flex items-center gap-4 ${variacao.positiva ? 'text-emerald-600' : 'text-rose-600'}`}>
              {variacao.positiva ? (
                <svg className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
              ) : (
                <svg className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
              )}
              <span className="font-black" style={buildTimeTextStyle(variacao.horasDiferenca, 2.25)}>
                {variacao.horasDiferenca}
              </span>
            </div>

            {/* Percentage badge */}
            <div className={`flex items-center gap-2 px-6 py-2.5 rounded-full ${variacao.positiva ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
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
        <SemanaCard semana={semana2} isHighlighted={true} isActive={isVisible} />
      </div>
    </SlideWrapper>
  );
});

SlideAderenciaGeral.displayName = 'SlideAderenciaGeral';

export default SlideAderenciaGeral;
