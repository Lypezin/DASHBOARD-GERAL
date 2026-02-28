
import React from 'react';
import { buildTimeTextStyle } from '../../utils';
import { VariationBadge } from './VariationBadge';
import { WeekComparisonCircle } from './WeekComparisonCircle';

interface VariacaoResumo { label: string; valor: string; positivo: boolean; }
interface OrigemComparativo {
    nome: string; horasPlanejadas: string;
    semana1: { aderencia: number; horasEntregues: string; };
    semana2: { aderencia: number; horasEntregues: string; };
    variacoes: VariacaoResumo[];
}

interface OrigemCardProps {
    item: OrigemComparativo;
    index: number;
    isSingleItem: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
}

export const OrigemCard: React.FC<OrigemCardProps> = ({
    item,
    index,
    isSingleItem,
    numeroSemana1,
    numeroSemana2
}) => {
    return (
        <div
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg ${isSingleItem ? 'w-full max-w-7xl mx-auto' : ''} animate-slide-up opacity-0`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 flex items-center justify-between gap-3 min-h-[4.5rem]">
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
                    <span className="text-[0.55rem] font-medium text-blue-100 block">Planejado</span>
                    <span className="text-white font-bold text-sm" style={buildTimeTextStyle(item.horasPlanejadas, 0.875)}>
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
    );
};
