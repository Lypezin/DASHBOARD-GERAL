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
      hideDecorations={true}
      className="flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 70%, #3b82f6 100%)',
        padding: '0',
        overflow: 'hidden',
      }}
    >
      {/* Modern geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient circles */}
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/15 to-transparent rounded-full blur-3xl" />

        {/* Geometric lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[15%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute top-[85%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute top-0 left-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute top-0 right-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>

        {/* Glowing orbs */}
        <div className="absolute top-[20%] right-[25%] w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_20px_8px_rgba(59,130,246,0.3)]" />
        <div className="absolute bottom-[25%] left-[20%] w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_25px_10px_rgba(99,102,241,0.2)]" />
        <div className="absolute top-[60%] right-[10%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_6px_rgba(34,211,238,0.25)]" />
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center px-16 py-12" style={{ width: '100%', height: '100%' }}>

        {/* Top accent line */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />

        {/* "RELATÓRIO" label */}
        <div className="mb-4">
          <span className="text-blue-300 text-lg font-medium tracking-[0.4em] uppercase">Análise Comparativa</span>
        </div>

        {/* Main title */}
        <h1 className="text-[3.5rem] font-black leading-none tracking-tight mb-2 text-white drop-shadow-lg">
          RELATÓRIO DE
        </h1>
        <h1 className="text-[4rem] font-black leading-none tracking-tight text-white drop-shadow-lg">
          RESULTADOS
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-blue-400 rounded" />
          <div className="w-3 h-3 rotate-45 border-2 border-blue-400 bg-transparent" />
          <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-blue-400 rounded" />
        </div>

        {/* Place name badge */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-white/5 blur-xl rounded-2xl" />
          <div className="relative bg-gradient-to-r from-white/10 via-white/15 to-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-10 py-4 shadow-2xl">
            <h2 className="text-[2.25rem] font-bold uppercase tracking-[0.15em] text-white">
              {pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}
            </h2>
          </div>
        </div>

        {/* Week comparison section */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-blue-200 text-base font-medium tracking-widest uppercase">Período Analisado</span>

          <div className="flex items-center gap-6">
            {/* Week 1 */}
            <div className="flex flex-col items-center bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
              <span className="text-sm font-semibold text-blue-300 mb-1">SEMANA {numeroSemana1}</span>
              <span className="text-lg font-bold text-white">{periodoSemana1}</span>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-base font-black text-white">VS</span>
              </div>
            </div>

            {/* Week 2 */}
            <div className="flex flex-col items-center bg-blue-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-400/30">
              <span className="text-sm font-semibold text-blue-200 mb-1">SEMANA {numeroSemana2}</span>
              <span className="text-lg font-bold text-white">{periodoSemana2}</span>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400/50" />
          <div className="w-2 h-2 rounded-full bg-blue-400/70" />
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <div className="w-2 h-2 rounded-full bg-blue-400/70" />
          <div className="w-2 h-2 rounded-full bg-blue-400/50" />
        </div>
      </div>
    </SlideWrapper>
  );
});

SlideCapa.displayName = 'SlideCapa';

export default SlideCapa;
