import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { SubPracaCard } from './components/SubPracaCard';
import { SubPracaModal } from './components/SubPracaModal';

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
  semana1: SemanaResumo;
  semana2: SemanaResumo;
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
    <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
      <SlideHeader
        title="SUB-PRAÇAS"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {totalPaginas > 1 && (
        <p className="text-center text-base font-medium text-slate-400 -mt-4 mb-2">
          Página {paginaAtual} de {totalPaginas}
        </p>
      )}

      {/* Cards Grid - 2x2 or centered single */}
      <div className={`${isSingleItem ? 'flex justify-center items-center' : 'grid grid-cols-2 gap-7'} flex-1 content-start`}>
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

      {/* Drill Down Modal */}
      {selectedItem && (
        <SubPracaModal
          selectedItem={selectedItem}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </SlideWrapper>
  );
};

export default SlideSubPracas;
