import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { buildTimeTextStyle } from '../utils';
import { SlideHeader } from './components/SlideHeader';
import { VariationBadge } from './components/VariationBadge';
import { WeekComparisonCircle } from './components/WeekComparisonCircle';

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
      <div className={`${isSingleItem ? 'flex justify-center items-center' : 'grid grid-cols-3 gap-6'} flex-1 content-center`}>
        {itens.map((item) => (
          <div
            key={item.nome}
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg overflow-hidden ${isSingleItem ? 'w-[700px]' : ''}`}
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-3.5 flex items-center justify-between gap-3">
              <h3
                className="text-white font-bold text-lg uppercase tracking-wide flex-1"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.2',
                  maxHeight: '2.4em'
                }}
                title={item.nome}
              >
                {item.nome}
              </h3>
              <div className="bg-blue-500 rounded-lg px-4 py-1.5 text-center flex-shrink-0">
                <span className="text-[0.6rem] font-medium text-blue-100 block">Planejado</span>
                <span className="text-white font-bold text-base" style={buildTimeTextStyle(item.horasPlanejadas, 1)}>
                  {item.horasPlanejadas}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className={isSingleItem ? 'p-8' : 'p-5'}>
              {/* Week Comparison */}
              <div className={`flex items-center justify-center ${isSingleItem ? 'gap-12' : 'gap-6'} mb-5`}>
                <WeekComparisonCircle
                  aderencia={item.semana1.aderencia}
                  horasEntregues={item.semana1.horasEntregues}
                  label={`SEM ${numeroSemana1}`}
                  isSecond={false}
                  size={isSingleItem ? 'large' : 'normal'}
                  circleSizePx={isSingleItem ? 110 : 90}
                />
                <WeekComparisonCircle
                  aderencia={item.semana2.aderencia}
                  horasEntregues={item.semana2.horasEntregues}
                  label={`SEM ${numeroSemana2}`}
                  isSecond={true}
                  size={isSingleItem ? 'large' : 'normal'}
                  circleSizePx={isSingleItem ? 110 : 90}
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
    </SlideWrapper>
  );
};

export default SlideOrigem;
