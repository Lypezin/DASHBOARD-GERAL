
import React from 'react';
import { buildTimeTextStyle } from '../../utils';
import { WeekComparisonCircle } from './WeekComparisonCircle';
import { VariationBadge } from './VariationBadge';
import { SubPracaComparativo } from '../SlideSubPracas';

interface SubPracaCardProps {
    item: SubPracaComparativo;
    index: number;
    isSingleItem: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    onClick: (item: SubPracaComparativo) => void;
}

export const SubPracaCard: React.FC<SubPracaCardProps> = ({
    item,
    index,
    isSingleItem,
    numeroSemana1,
    numeroSemana2,
    onClick
}) => {
    return (
        <div
            onClick={() => onClick(item)}
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg ${isSingleItem ? 'w-full max-w-7xl mx-auto' : 'h-full flex flex-col'} animate-slide-up opacity-0 cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
            {/* Card Header - Fixed height for alignment */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 dark:from-blue-900 dark:to-blue-800 px-5 py-3 flex items-center justify-between gap-4 h-[5.5rem] flex-shrink-0 rounded-t-2xl">
                <h3
                    className="text-white font-bold text-lg uppercase tracking-wide flex-1 leading-snug line-clamp-3"
                    style={{
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                    }}
                    title={item.nome}
                >
                    {item.nome}
                </h3>
            </div>

            {/* Card Body */}
            <div className={`${isSingleItem ? 'p-10' : 'p-5'} flex-1 flex flex-col justify-center`}>
                {/* Week Comparison */}
                <div className={`flex items-start justify-center ${isSingleItem ? 'gap-12' : 'gap-8'} mb-5`}>
                    <WeekComparisonCircle
                        aderencia={item.semana1.aderencia}
                        horasEntregues={item.semana1.horasEntregues}
                        horasPlanejadas={item.semana1.horasPlanejadas}
                        label={`SEM ${numeroSemana1}`}
                        isSecond={false}
                        size={isSingleItem ? 'large' : 'normal'}
                        circleSizePx={isSingleItem ? 110 : 95} // 95 to match original SubPracas
                    />
                    <WeekComparisonCircle
                        aderencia={item.semana2.aderencia}
                        horasEntregues={item.semana2.horasEntregues}
                        horasPlanejadas={item.semana2.horasPlanejadas}
                        label={`SEM ${numeroSemana2}`}
                        isSecond={true}
                        size={isSingleItem ? 'large' : 'normal'}
                        circleSizePx={isSingleItem ? 110 : 95}
                    />
                </div>

                {/* Variations Row */}
                <div className="flex gap-3 animate-float-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
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
