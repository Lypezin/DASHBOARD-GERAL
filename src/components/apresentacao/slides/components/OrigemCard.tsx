
import React from 'react';
import { VariationBadge } from './VariationBadge';
import { WeekComparisonCircle } from './WeekComparisonCircle';

interface VariacaoResumo { label: string; valor: string; positivo: boolean; }
interface OrigemComparativo {
    nome: string; horasPlanejadas: string;
    semana1: { aderencia: number; horasEntregues: string; horasPlanejadas: string; };
    semana2: { aderencia: number; horasEntregues: string; horasPlanejadas: string; };
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
            className={`rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg ${isSingleItem ? 'w-full max-w-7xl mx-auto' : 'min-h-[360px] flex flex-col'} animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 dark:from-blue-900 dark:to-blue-800 px-5 py-3 flex items-center justify-between gap-3 min-h-[4.5rem] rounded-t-2xl flex-shrink-0">
                <h3
                    className="text-white font-bold text-lg uppercase tracking-wide flex-1 leading-snug line-clamp-2"
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
            <div className={`${isSingleItem ? 'p-8' : 'p-5'} flex-1 flex flex-col justify-between`}>
                {/* Week Comparison */}
                <div className={`flex items-start justify-center ${isSingleItem ? 'gap-12' : 'gap-6'} mb-5`}>
                    <WeekComparisonCircle
                        aderencia={item.semana1.aderencia}
                        horasEntregues={item.semana1.horasEntregues}
                        horasPlanejadas={item.semana1.horasPlanejadas}
                        label={`SEM ${numeroSemana1}`}
                        isSecond={false}
                        size={isSingleItem ? 'large' : 'normal'}
                        circleSizePx={isSingleItem ? 110 : 98}
                    />
                    <WeekComparisonCircle
                        aderencia={item.semana2.aderencia}
                        horasEntregues={item.semana2.horasEntregues}
                        horasPlanejadas={item.semana2.horasPlanejadas}
                        label={`SEM ${numeroSemana2}`}
                        isSecond={true}
                        size={isSingleItem ? 'large' : 'normal'}
                        circleSizePx={isSingleItem ? 110 : 98}
                    />
                </div>

                {/* Variations Row */}
                <div className="grid grid-cols-3 gap-2 lg:gap-3 animate-float-up w-full mt-auto" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
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
