import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';
import { SemanaCard } from './SemanaCard';

interface SemanaResumo { numeroSemana: string; aderencia: number; horasPlanejadas: string; horasEntregues: string; }

interface VariacaoResumo { horasDiferenca: string; horasPercentual: string; positiva: boolean; }

interface SlideAderenciaGeralProps { isVisible: boolean; semana1: SemanaResumo; semana2: SemanaResumo; variacao: VariacaoResumo; }

const SlideAderenciaGeral: React.FC<SlideAderenciaGeralProps> = React.memo(({ isVisible, semana1, semana2, variacao }) => {
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
        <p className="text-xl font-light text-slate-500 dark:text-slate-400 mt-3">
          Comparativo Semanas {semana1.numeroSemana} vs {semana2.numeroSemana}
        </p>
      </header>

      {/* Main content */}
      <div className="flex w-full justify-evenly items-center gap-4 flex-1 px-8">
        {/* Semana 1 */}
        <div className="animate-slide-in-left" style={{ animationFillMode: 'forwards' }}>
          <SemanaCard semana={semana1} isHighlighted={false} isActive={isVisible} />
        </div>

        {/* Central variation box */}
        <div className="flex flex-col items-center justify-center animate-count-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <div className={`rounded-2xl border-2 px-12 py-10 text-center flex flex-col items-center gap-8 shadow-xl ${variacao.positiva
            ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:via-emerald-800/20 dark:to-emerald-900/40 border-emerald-300 dark:border-emerald-700'
            : 'bg-gradient-to-br from-rose-50 via-rose-100 to-rose-50 dark:from-rose-900/40 dark:via-rose-800/20 dark:to-rose-900/40 border-rose-300 dark:border-rose-700'
            }`}>

            <p className="text-xl font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Variação</p>

            {/* Arrow and difference */}
            <div className={`flex items-center gap-4 ${variacao.positiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
            <div className={`flex items-center gap-2 px-6 py-2.5 rounded-full ${variacao.positiva ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300'
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
        <div className="animate-slide-in-right" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <SemanaCard semana={semana2} isHighlighted={true} isActive={isVisible} />
        </div>
      </div>
    </SlideWrapper>
  );
});

SlideAderenciaGeral.displayName = 'SlideAderenciaGeral';

export default SlideAderenciaGeral;
