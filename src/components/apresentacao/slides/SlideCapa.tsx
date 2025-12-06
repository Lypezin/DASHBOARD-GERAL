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

const SlideCapa: React.FC<SlideCapaProps> = ({
  isVisible,
  pracaSelecionada,
  numeroSemana1,
  numeroSemana2,
  periodoSemana1,
  periodoSemana2,
}) => {
  return (
    <SlideWrapper
      isVisible={isVisible}
      style={{
        padding: 0,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e40af 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400/10" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-16">
        {/* Company/Brand Logo area */}
        <div className="mb-8">
          <div className="w-20 h-1 bg-blue-400 rounded-full mx-auto" />
        </div>

        {/* Main title */}
        <h1 className="text-6xl font-black text-white tracking-wider text-center mb-6 leading-tight">
          COMPARATIVO<br />SEMANAL
        </h1>

        {/* Praça badge */}
        {pracaSelecionada && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-10 py-4 mb-10">
            <p className="text-white/70 text-lg font-medium uppercase tracking-wider mb-1 text-center">
              Praça
            </p>
            <p className="text-white text-3xl font-bold text-center">
              {pracaSelecionada}
            </p>
          </div>
        )}

        {/* Week comparison */}
        <div className="flex items-center gap-8">
          {/* Week 1 */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-6 text-center min-w-[220px]">
            <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2">
              Semana
            </p>
            <p className="text-white text-5xl font-black mb-2">
              {numeroSemana1}
            </p>
            <p className="text-white/60 text-sm font-medium">
              {periodoSemana1}
            </p>
          </div>

          {/* VS badge */}
          <div className="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white text-xl font-black">VS</span>
          </div>

          {/* Week 2 */}
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-8 py-6 text-center min-w-[220px] shadow-lg">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
              Semana
            </p>
            <p className="text-white text-5xl font-black mb-2">
              {numeroSemana2}
            </p>
            <p className="text-white/70 text-sm font-medium">
              {periodoSemana2}
            </p>
          </div>
        </div>

        {/* Footer accent */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideCapa;
