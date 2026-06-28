import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { SubPracaCard } from './components/SubPracaCard';
import { SubPracaModal } from './components/SubPracaModal';
import { cn } from '@/lib/utils';

interface SemanaResumo {
  aderencia: number;
  horasEntregues: string;
}

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

export interface SubPracaComparativo {
  nome: string;
  horasPlanejadas: string;
  semana1: SemanaResumo & { horasPlanejadas: string };
  semana2: SemanaResumo & { horasPlanejadas: string };
  variacoes: VariacaoResumo[];
}

interface SlideSubPracasProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: SubPracaComparativo[];
}

const SlideSubPracas: React.FC<SlideSubPracasProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  const isSingleItem = itens.length === 1;
  const [selectedItem, setSelectedItem] = React.useState<SubPracaComparativo | null>(null);

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '28px 42px' }}>
      <SlideHeader
        title="SUB-PRAÇAS"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {totalPaginas > 1 ? (
        <p className="mb-3 -mt-3 text-center text-base font-medium text-slate-400">
          Página {paginaAtual} de {totalPaginas}
        </p>
      ) : null}

      <div className={cn(
        'grid flex-1 w-full max-w-[1550px] mx-auto content-start items-stretch gap-6 pt-4',
        itens.length === 1 && 'flex justify-center items-start',
        itens.length === 2 && 'grid-cols-2',
        itens.length === 3 && 'grid-cols-3',
        itens.length >= 4 && 'grid-cols-2 lg:grid-cols-4'
      )}>
        {itens.map((item, index) => (
          <SubPracaCard
            key={item.nome}
            item={item}
            index={index}
            isSingleItem={isSingleItem}
            numeroSemana1={numeroSemana1}
            numeroSemana2={numeroSemana2}
            onClick={setSelectedItem}
          />
        ))}
      </div>

      {selectedItem ? (
        <SubPracaModal
          selectedItem={selectedItem}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </SlideWrapper>
  );
};

export default SlideSubPracas;
