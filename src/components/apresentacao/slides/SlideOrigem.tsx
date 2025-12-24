
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
  };
  semana2: {
    aderencia: number;
    horasEntregues: string;
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
    <SlideWrapper isVisible={isVisible} style={{ padding: '28px 48px' }}>
      <SlideHeader
        title="ORIGENS"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {totalPaginas > 1 && (
        <p className="text-center text-base font-medium text-slate-400 -mt-4 mb-2">
          Página {paginaAtual} de {totalPaginas}
        </p>
      )}

      {/* Cards Grid - responsive based on count */}
      <div className={`${isSingleItem ? 'flex justify-center items-center' : 'grid grid-cols-3 gap-6'} flex-1 content-start`}>
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
    </SlideWrapper>
  );
};

export default SlideOrigem;
