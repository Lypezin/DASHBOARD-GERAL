import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { OrigemCard } from './components/OrigemCard';

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface OrigemComparativo {
  nome: string;
  horasPlanejadas: string;
  semana1: {
    aderencia: number;
    horasEntregues: string;
    horasPlanejadas: string;
  };
  semana2: {
    aderencia: number;
    horasEntregues: string;
    horasPlanejadas: string;
  };
  variacoes: VariacaoResumo[];
}

interface SlideOrigemProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: OrigemComparativo[];
}

const SlideOrigem: React.FC<SlideOrigemProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  const isSingleItem = itens.length === 1;

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '28px 42px' }}>
      <SlideHeader
        title="ORIGENS"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {totalPaginas > 1 ? (
        <p className="mb-3 -mt-3 text-center text-base font-medium text-slate-400">
          Página {paginaAtual} de {totalPaginas}
        </p>
      ) : null}

      <div className="flex-1 w-full max-w-[1550px] mx-auto flex items-start justify-center pt-4">
        <div className={`w-full gap-6 ${itens.length === 1 ? 'flex justify-center items-start' : ''} ${itens.length === 2 ? 'grid grid-cols-2 max-w-5xl' : ''} ${itens.length === 3 ? 'grid grid-cols-3' : ''}`}>
          {itens.map((item, index) => (
            <OrigemCard
              key={item.nome}
              item={item}
              index={index}
              isSingleItem={isSingleItem}
              numeroSemana1={numeroSemana1}
              numeroSemana2={numeroSemana2}
            />
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
};

export default SlideOrigem;
