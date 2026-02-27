import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { MetricCard } from './components/MetricCard';
import { VariationCard } from './components/VariationCard';
import { DemandaOrigemItem } from '@/utils/apresentacao/processors/demandaOrigem';

interface SlideDemandaOrigemProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    paginaAtual: number;
    totalPaginas: number;
    itens: DemandaOrigemItem[];
}

const SlideDemandaOrigem: React.FC<SlideDemandaOrigemProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    paginaAtual,
    totalPaginas,
    itens,
}) => {
    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
            <SlideHeader
                title="DEMANDA POR ORIGEM"
                subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
            />

            {totalPaginas > 1 && (
                <p className="text-center text-base font-medium text-slate-400 -mt-4 mb-3">
                    Página {paginaAtual} de {totalPaginas}
                </p>
            )}

            {itens.map((origem) => (
                <div key={origem.nome} className="flex flex-col gap-3 flex-1">
                    {/* Origem label */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                            {origem.nome}
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Col headers */}
                    <div className="grid grid-cols-3 gap-6">
                        <h3 className="text-base font-bold text-center px-4 py-2 bg-sky-50 rounded-xl text-sky-800 border border-sky-100 uppercase tracking-wide">
                            SEMANA {numeroSemana1}
                        </h3>
                        <h3 className="text-base font-bold text-center px-4 py-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100 uppercase tracking-wide">
                            VARIAÇÕES
                        </h3>
                        <h3 className="text-base font-bold text-center px-4 py-2 bg-blue-600 rounded-xl text-white shadow-md uppercase tracking-wide border border-blue-700">
                            SEMANA {numeroSemana2}
                        </h3>
                    </div>

                    {/* Metric rows */}
                    <div className="flex flex-col gap-2 flex-1 justify-center">
                        {origem.metricas.map((metrica) => (
                            <div key={metrica.label} className="grid grid-cols-3 gap-6">
                                <MetricCard
                                    label={metrica.label}
                                    value={metrica.semana1Valor}
                                    variant="week1"
                                />
                                <VariationCard
                                    label={metrica.label}
                                    value={metrica.variacaoValor}
                                    positive={metrica.variacaoPositiva}
                                    percentual={metrica.variacaoPercentual}
                                    percentualPositiva={metrica.variacaoPercentualPositiva}
                                />
                                <MetricCard
                                    label={metrica.label}
                                    value={metrica.semana2Valor}
                                    variant="week2"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </SlideWrapper>
    );
};

export default SlideDemandaOrigem;
