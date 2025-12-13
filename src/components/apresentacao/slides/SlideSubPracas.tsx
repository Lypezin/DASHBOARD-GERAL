import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';
import { SlideHeader } from './components/SlideHeader';
import { VariationBadge } from './components/VariationBadge';
import { WeekComparisonCircle } from './components/WeekComparisonCircle';

interface SemanaResumo {
  aderencia: number;
  horasEntregues: string;
}

interface VariacaoResumo {
  label: string;
  valor: string;
  positivo: boolean;
}

interface SubPracaComparativo {
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
          <div
            key={item.nome}
            onClick={() => setSelectedItem(item)}
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg ${isSingleItem ? 'w-full max-w-7xl mx-auto' : ''} animate-slide-up opacity-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            {/* Card Header - Full width with name and planned */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-5 py-3 flex items-center justify-between gap-4 min-h-[4.5rem]">
              <h3
                className="text-white font-bold text-base uppercase tracking-wide flex-1 leading-snug"
                style={{
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
                title={item.nome}
              >
                {item.nome}
              </h3>
              <div className="bg-blue-500 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                <span className="text-[0.55rem] font-medium text-blue-100 block uppercase">Planejado</span>
                <span className="text-white font-bold text-sm" style={buildTimeTextStyle(item.horasPlanejadas, 0.875)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className={isSingleItem ? 'p-10' : 'p-5'}>
              {/* Week Comparison */}
              <div className={`flex items-center justify-center ${isSingleItem ? 'gap-12' : 'gap-8'} mb-5`}>
                <WeekComparisonCircle
                  aderencia={item.semana1.aderencia}
                  horasEntregues={item.semana1.horasEntregues}
                  label={`SEM ${numeroSemana1}`}
                  isSecond={false}
                  size={isSingleItem ? 'large' : 'normal'}
                  circleSizePx={isSingleItem ? 110 : 95} // 95 to match original SubPracas
                />
                <WeekComparisonCircle
                  aderencia={item.semana2.aderencia}
                  horasEntregues={item.semana2.horasEntregues}
                  label={`SEM ${numeroSemana2}`}
                  isSecond={true}
                  size={isSingleItem ? 'large' : 'normal'}
                  circleSizePx={isSingleItem ? 110 : 95}
                />
              </div>

              {/* Variations Row */}
              <div className="flex gap-2.5">
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
          </div>
        ))}
      </div>

      {/* Drill Down Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100010] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2">{selectedItem.nome}</h2>
              <p className="text-blue-100 text-lg">Detalhamento de Performance</p>
            </div>

            {/* Content */}
            <div className="p-10">
              <div className="flex justify-center items-center gap-16 mb-10">
                <div className="text-center transform scale-125">
                  <WeekComparisonCircle
                    aderencia={selectedItem.semana1.aderencia}
                    horasEntregues={selectedItem.semana1.horasEntregues}
                    label={`SEMANA ${numeroSemana1}`}
                    isSecond={false}
                    size="large"
                  />
                </div>
                <div className="w-px h-32 bg-slate-200"></div>
                <div className="text-center transform scale-125">
                  <WeekComparisonCircle
                    aderencia={selectedItem.semana2.aderencia}
                    horasEntregues={selectedItem.semana2.horasEntregues}
                    label={`SEMANA ${numeroSemana2}`}
                    isSecond={true}
                    size="large"
                  />
                </div>
              </div>
            </div>

            {/* Footer Insight from AI Logic (Mocked for now or reused) */}
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
              <p className="text-center text-slate-500 text-sm">
                Use a ferramenta de <strong>Caneta</strong> para fazer anotações sobre este resultado.
              </p>
            </div>
          </div>
        </div>
      )}

    </SlideWrapper>
  );
};

export default SlideSubPracas;
