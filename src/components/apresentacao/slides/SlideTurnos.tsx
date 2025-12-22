import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SubPracaModal } from './components/SubPracaModal';
import { SlideHeader } from './components/SlideHeader';
import { VariationBadge } from './components/VariationBadge';
import { WeekCircle } from './components/WeekCircle';

interface TurnoResumo {
  aderencia: number;
  horasEntregues: string;
}

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface TurnoComparativo {
  nome: string;
  horasPlanejadas: string;
  semana1: TurnoResumo;
  semana2: TurnoResumo;
  variacoes: VariacaoResumo[];
}

interface SlideTurnosProps {
  isVisible: boolean;
  numeroSemana1: string;
  numeroSemana2: string;
  paginaAtual: number;
  totalPaginas: number;
  itens: TurnoComparativo[];
}

const SlideTurnos: React.FC<SlideTurnosProps> = ({
  isVisible,
  numeroSemana1,
  numeroSemana2,
  paginaAtual,
  totalPaginas,
  itens,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<TurnoComparativo | null>(null);

  return (
    <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
      <SlideHeader
        title="TURNOS"
        subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
      />

      {totalPaginas > 1 && (
        <p className="text-center text-base font-medium text-slate-400 -mt-4 mb-6">
          Página {paginaAtual} de {totalPaginas}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1 content-start mt-4">
        {itens.map((item) => (
          <div
            key={item.nome}
            onClick={() => setSelectedItem(item)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-center">
              <h3 className="text-xl font-black text-slate-700 uppercase tracking-wider bg-slate-50 px-6 py-2 rounded-lg border border-slate-100">
                {item.nome}
              </h3>
            </div>

            <div className="flex justify-center items-center gap-12">
              <WeekCircle
                semana={item.semana1}
                label={`SEM ${numeroSemana1}`}
                isSecond={false}
                isActive={isVisible}
              />
              <WeekCircle
                semana={item.semana2}
                label={`SEM ${numeroSemana2}`}
                isSecond={true}
                isActive={isVisible}
              />
            </div>

            <div className="flex gap-3 mt-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
              {item.variacoes.map((variacao) => (
                <VariationBadge
                  key={variacao.label}
                  label={variacao.label}
                  value={variacao.valor}
                  positive={variacao.positivo}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <SubPracaModal
          selectedItem={selectedItem as any}
          numeroSemana1={numeroSemana1}
          numeroSemana2={numeroSemana2}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </SlideWrapper>
  );
};

export default SlideTurnos;
