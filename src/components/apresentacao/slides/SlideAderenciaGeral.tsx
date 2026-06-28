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
      style={{ padding: '32px 44px' }}
    >
      <header className="mb-7 text-center">
        <div className="inline-block">
          <h2 className="text-[3.5rem] font-black leading-none tracking-wider text-blue-600">
            ADERÊNCIA GERAL
          </h2>
          <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
        </div>
        <p className="mt-3 text-xl font-light text-slate-500 dark:text-slate-400">
          Comparativo Semanas {semana1.numeroSemana} vs {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full flex-1 items-center justify-evenly gap-5 px-4">
        <div className="animate-slide-in-left" style={{ animationFillMode: 'forwards' }}>
          <SemanaCard semana={semana1} isHighlighted={false} isActive={isVisible} />
        </div>

        <div className="flex animate-count-in flex-col items-center justify-center" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <div className={`flex flex-col items-center gap-7 rounded-2xl border-2 px-10 py-9 text-center shadow-xl ${variacao.positiva
            ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 dark:border-emerald-700 dark:from-emerald-900/40 dark:via-emerald-800/20 dark:to-emerald-900/40'
            : 'border-rose-300 bg-gradient-to-br from-rose-50 via-rose-100 to-rose-50 dark:border-rose-700 dark:from-rose-900/40 dark:via-rose-800/20 dark:to-rose-900/40'
            }`}>
            <p className="text-xl font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Variação</p>

            <div className={`flex items-center gap-4 ${variacao.positiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-4xl shadow-sm dark:bg-slate-950/30" aria-hidden="true">
                {variacao.positiva ? '🚀' : '⚠'}
              </span>
              <span className="font-black" style={buildTimeTextStyle(variacao.horasDiferenca, 2.25)}>
                {variacao.horasDiferenca}
              </span>
            </div>

            <div className={`flex items-center gap-2 rounded-full px-6 py-2.5 ${variacao.positiva ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
              }`}>
              <span aria-hidden="true">{variacao.positiva ? '🚀' : '⚠'}</span>
              <span className="text-2xl font-bold">
                {variacao.horasPercentual}
              </span>
            </div>
          </div>
        </div>

        <div className="animate-slide-in-right" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <SemanaCard semana={semana2} isHighlighted={true} isActive={isVisible} />
        </div>
      </div>
    </SlideWrapper>
  );
});

SlideAderenciaGeral.displayName = 'SlideAderenciaGeral';

export default SlideAderenciaGeral;
