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
      className="items-center justify-center"
      style={{ padding: '40px 50px', overflow: 'visible' }}
    >
      <header className="text-center mb-4">
        <h2 className="text-[2.5rem] font-black leading-none tracking-wider mb-1.5 text-blue-600">ADERÊNCIA GERAL</h2>
        <p className="text-[1.25rem] font-light text-slate-500">
          SEMANAS {semana1.numeroSemana} &amp; {semana2.numeroSemana}
        </p>
      </header>

      <div className="flex w-full justify-center items-start gap-4" style={{ overflow: 'visible' }}>
        {/* Semana 1 */}
        <SemanaCard semana={semana1} />

        {/* Coluna Central - Variação */}
        <div className="flex flex-col items-center justify-center" style={{ overflow: 'visible', marginTop: '50px' }}>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-center flex flex-col items-center gap-1.5" style={{ overflow: 'visible' }}>
            <p className="text-[1rem] font-medium text-slate-500">Variação</p>
            <p
              className={`font-bold ${variacao.positiva ? 'text-emerald-600' : 'text-rose-600'}`}
              style={buildTimeTextStyle(variacao.horasDiferenca, 1.15)}
            >
              {variacao.horasDiferenca}
            </p>
            <p
              className={`text-[1rem] font-semibold ${variacao.positiva ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {variacao.horasPercentual}
            </p>
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

