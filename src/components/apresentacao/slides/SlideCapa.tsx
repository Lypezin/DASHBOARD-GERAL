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
      style={{ padding: '60px 80px', overflow: 'visible' }}
    >
      <div className="flex-1 text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-[72px] font-black leading-none tracking-wide">RELATÓRIO DE RESULTADOS</h1>
        </div>

        <div className="space-y-8">
          <h2 className="text-[48px] font-semibold uppercase tracking-widest">
            {pracaSelecionada?.toUpperCase() || 'TODAS AS PRAÇAS'}
          </h2>
          <h3 className="text-[36px] font-medium tracking-wider">
            SEMANAS {numeroSemana1} &amp; {numeroSemana2}
          </h3>
          <p className="text-[24px] font-light opacity-90">
            {periodoSemana1} &nbsp;|&nbsp; {periodoSemana2}
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideCapa;

