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
      className="flex items-center justify-center"
      style={{ padding: '100px 120px' }}
    >
      <div className="flex-1 text-center space-y-16">
        <div className="space-y-6">
          <h1 className="text-[9rem] font-black leading-none tracking-wide">RELATÓRIO DE</h1>
          <h1 className="text-[9rem] font-black leading-none tracking-wide">RESULTADOS</h1>
        </div>

        <div className="space-y-8">
          <h2 className="text-[5rem] font-semibold uppercase tracking-widest">
            {pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}
          </h2>
          <h3 className="text-[4.5rem] font-medium tracking-wider">
            SEMANAS {numeroSemana1} &amp; {numeroSemana2}
          </h3>
          <p className="text-[3rem] font-light opacity-90">
            {periodoSemana1} &nbsp;|&nbsp; {periodoSemana2}
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideCapa;

