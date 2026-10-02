import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
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
          <h2 className="text-[3.25rem] font-semibold leading-none tracking-tight text-primary">
            ADERÊNCIA GERAL
          </h2>
          <div className="mt-3 h-px bg-border" />
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
          <div className={`flex flex-col items-center gap-7 rounded-lg border px-10 py-9 text-center ${variacao.positiva
            ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20'
            : 'border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/20'
            }`}>
            <p className="text-xl font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Variação</p>

            <div className={`flex items-center gap-4 ${variacao.positiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background" aria-hidden="true">
                {variacao.positiva ? <TrendingUp className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </span>
              <span className="font-black" style={buildTimeTextStyle(variacao.horasDiferenca, 2.25)}>
                {variacao.horasDiferenca}
              </span>
            </div>

            <div className={`flex items-center gap-2 rounded-full px-6 py-2.5 ${variacao.positiva ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
              }`}>
              {variacao.positiva ? <TrendingUp className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
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
