import React from 'react';
import SlideWrapper from '../SlideWrapper';

interface SlideCapaProps {
  isVisible: boolean;
  pracaSelecionada: string | null;
  numeroSemana1: string;
  numeroSemana2: string;
  periodoSemana1: string;
  periodoSemana2: string;
}

const SlideCapa: React.FC<SlideCapaProps> = React.memo(({
  isVisible,
  pracaSelecionada,
  numeroSemana1,
  numeroSemana2,
  periodoSemana1,
  periodoSemana2,
}) => {
  if (!numeroSemana1 || !numeroSemana2) {
    return null;
  }

  return (
    <SlideWrapper
      isVisible={isVisible}
      className="flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
        padding: '60px 80px'
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 flex-1 text-center space-y-8 text-white">
        {/* Main title */}
        <div className="space-y-4">
          <div className="inline-block">
            <h1 className="text-[4rem] font-black leading-none tracking-wide drop-shadow-lg">
              RELATÓRIO DE RESULTADOS
            </h1>
            <div className="h-1.5 bg-gradient-to-r from-transparent via-white to-transparent rounded-full mt-4 opacity-50" />
          </div>
        </div>

        {/* Place name */}
        <div className="space-y-6">
          <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-10 py-4">
            <h2 className="text-[2.5rem] font-bold uppercase tracking-widest">
              {pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}
            </h2>
          </div>

          {/* Week info */}
          <div className="space-y-3">
            <h3 className="text-[2rem] font-semibold tracking-wider">
              Semanas {numeroSemana1} &amp; {numeroSemana2}
            </h3>
            <div className="flex items-center justify-center gap-4 text-[1.25rem] font-light opacity-90">
              <span className="bg-white/10 px-4 py-1.5 rounded-lg">{periodoSemana1}</span>
              <span className="text-white/50">vs</span>
              <span className="bg-white/10 px-4 py-1.5 rounded-lg">{periodoSemana2}</span>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
});

SlideCapa.displayName = 'SlideCapa';

export default SlideCapa;
